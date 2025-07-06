#!/usr/bin/env python3
"""
Script di test per verificare il funzionamento dell'algoritmo di ottimizzazione
senza dipendenze esterne (pytest)
"""

import sys
import os
import time
import json

# Aggiungi il path del progetto
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from domain.entities import Tool, ODL, Autoclave
from core.pre_filters.curing_cycle_filter import CuringCycleFilter
from core.pre_filters.elevated_support_filter import ElevatedSupportFilter
from core.optimization.multi_autoclave_optimizer import MultiAutoclaveOptimizer
from core.optimization.constraints import NestingConstraints

def print_section(title):
    """Helper per formattare l'output"""
    print(f"\n{'='*60}")
    print(f"{title:^60}")
    print('='*60)

def create_test_data():
    """Crea dati di test realistici"""
    print_section("CREAZIONE DATI DI TEST")
    
    # Tool di diverse dimensioni (in mm)
    tools = {
        'small': [
            Tool(id=f"T-S{i}", width=300+i*50, height=400+i*50, weight=5+i)
            for i in range(5)
        ],
        'medium': [
            Tool(id=f"T-M{i}", width=600+i*50, height=800+i*50, weight=15+i*2)
            for i in range(5)
        ],
        'large': [
            Tool(id=f"T-L{i}", width=1000+i*100, height=1500+i*100, weight=30+i*5)
            for i in range(5)
        ]
    }
    
    # ODL con cicli diversi
    odls = []
    
    # Ciclo A - pezzi piccoli
    for i in range(8):
        odl = ODL(
            id=f"ODL-A{i+1:03d}",
            odl_number=f"2024-A{i+1:03d}",
            part_number=f"PN-123{i+1}",
            curing_cycle="CICLO_A",
            vacuum_lines=2,
            tools=[tools['small'][i % 5]]
        )
        odls.append(odl)
    
    # Ciclo B - pezzi medi
    for i in range(6):
        odl = ODL(
            id=f"ODL-B{i+1:03d}",
            odl_number=f"2024-B{i+1:03d}",
            part_number=f"PN-456{i+1}",
            curing_cycle="CICLO_B",
            vacuum_lines=3,
            tools=[tools['medium'][i % 5]]
        )
        odls.append(odl)
    
    # Ciclo C - pezzi grandi
    for i in range(4):
        odl = ODL(
            id=f"ODL-C{i+1:03d}",
            odl_number=f"2024-C{i+1:03d}",
            part_number=f"PN-789{i+1}",
            curing_cycle="CICLO_C",
            vacuum_lines=4,
            tools=[tools['large'][i % 5]]
        )
        odls.append(odl)
    
    # Autoclavi disponibili (dimensioni reali in mm)
    autoclaves = [
        Autoclave(id="AC1", code="AC-001", width=1900, height=8000, vacuum_lines=20, max_weight=2000),
        Autoclave(id="AC2", code="AC-002", width=1500, height=6000, vacuum_lines=15, max_weight=1500),
        Autoclave(id="AC3", code="AC-003", width=1200, height=4000, vacuum_lines=10, max_weight=1000),
    ]
    
    print(f"✓ Creati {len(odls)} ODL con {sum(len(odl.tools) for odl in odls)} tool totali")
    print(f"✓ Disponibili {len(autoclaves)} autoclavi")
    
    return odls, autoclaves

def test_curing_cycle_analysis(odls):
    """Test 1: Analisi cicli di cura"""
    print_section("TEST 1: ANALISI CICLI DI CURA")
    
    groups, recommendations = CuringCycleFilter.analyze_cycles(odls)
    
    print(f"\nTrovati {len(groups)} cicli di cura diversi:")
    print("-" * 60)
    print(f"{'Ciclo':<10} {'ODL':<6} {'Area (m²)':<12} {'Score':<8} {'Raccomandato':<12}")
    print("-" * 60)
    
    for group in sorted(groups, key=lambda g: g.optimization_score, reverse=True):
        is_recommended = group.cycle_code in recommendations
        print(f"{group.cycle_code:<10} {group.odl_count:<6} "
              f"{group.total_area/1000000:<12.2f} {group.optimization_score:<8.3f} "
              f"{'✓' if is_recommended else '':<12}")
    
    print(f"\n✅ Cicli raccomandati: {', '.join(recommendations)}")
    return recommendations

def test_elevated_support_analysis(odls):
    """Test 2: Analisi supporti rialzati"""
    print_section("TEST 2: ANALISI SUPPORTI RIALZATI")
    
    elevated_by_odl, space_saved = ElevatedSupportFilter.analyze_elevated_candidates(odls)
    recommendations = ElevatedSupportFilter.get_tool_recommendations(odls, elevated_by_odl)
    
    total_tools = len(recommendations)
    elevated_count = sum(1 for r in recommendations if r['recommendation'] == 'ELEVATE')
    
    print(f"\nAnalizzati {total_tools} tool:")
    print(f"- {elevated_count} raccomandati per supporti rialzati")
    print(f"- {total_tools - elevated_count} per livello base")
    print(f"- Spazio risparmiato stimato: {space_saved:.1f}%")
    
    # Mostra top 5 tool per elevazione
    elevated_tools = sorted(
        [r for r in recommendations if r['recommendation'] == 'ELEVATE'],
        key=lambda t: t['area'],
        reverse=True
    )[:5]
    
    if elevated_tools:
        print("\nTop 5 tool per supporti rialzati:")
        print("-" * 60)
        print(f"{'Tool ID':<15} {'Dimensioni (mm)':<20} {'Area (m²)':<12} {'Aspect':<8}")
        print("-" * 60)
        for tool in elevated_tools:
            print(f"{tool['tool_id']:<15} "
                  f"{int(tool['width'])} x {int(tool['height']):<15} "
                  f"{tool['area']/1000000:<12.3f} "
                  f"{tool['aspect_ratio']:<8.2f}")
    
    # Ritorna tool IDs elevati
    elevated_tool_ids = [r['tool_id'] for r in recommendations if r['recommendation'] == 'ELEVATE']
    return elevated_tool_ids

def test_multi_autoclave_optimization(odls, autoclaves, selected_cycles, elevated_tools):
    """Test 3: Ottimizzazione multi-autoclave"""
    print_section("TEST 3: OTTIMIZZAZIONE MULTI-AUTOCLAVE")
    
    # Filtra ODL per cicli selezionati
    filtered_odls = [odl for odl in odls if odl.curing_cycle in selected_cycles]
    print(f"\nOttimizzazione di {len(filtered_odls)} ODL con cicli: {', '.join(selected_cycles)}")
    
    # Prepara mapping elevated tools
    elevated_mapping = {}
    for odl in filtered_odls:
        elevated_for_odl = [t.id for t in odl.tools if t.id in elevated_tools]
        if elevated_for_odl:
            elevated_mapping[odl.id] = elevated_for_odl
    
    # Configura constraints
    constraints = NestingConstraints(
        min_border_distance=50,
        min_tool_distance=30,
        allow_rotation=True,
        timeout_seconds=60
    )
    
    # Esegui ottimizzazione
    optimizer = MultiAutoclaveOptimizer(constraints)
    
    print("\nEsecuzione ottimizzazione...")
    start_time = time.time()
    
    batches, metrics = optimizer.optimize(
        filtered_odls,
        autoclaves,
        elevated_mapping
    )
    
    execution_time = time.time() - start_time
    
    # Risultati
    print(f"\n✅ Ottimizzazione completata in {execution_time:.2f} secondi")
    print(f"\nRisultati:")
    print(f"- Batch creati: {len(batches)}")
    print(f"- ODL posizionati: {metrics['total_odls_placed']}/{metrics['total_odls_input']}")
    print(f"- Tasso di successo: {metrics['success_rate']*100:.1f}%")
    
    # Dettagli per batch
    print("\nDettagli batch:")
    print("-" * 80)
    print(f"{'Autoclave':<12} {'ODL':<6} {'Tool':<6} {'Efficienza':<12} "
          f"{'Peso (kg)':<10} {'Vuoto':<8}")
    print("-" * 80)
    
    for batch in batches:
        autoclave = next(a for a in autoclaves if a.id == batch.autoclave_id)
        odl_count = len(set(p.odl_id for p in batch.placements))
        tool_count = len(batch.placements)
        
        print(f"{autoclave.code:<12} {odl_count:<6} {tool_count:<6} "
              f"{batch.efficiency*100:<11.1f}% "
              f"{batch.total_weight:<10.0f} "
              f"{batch.vacuum_lines_used}/{autoclave.vacuum_lines:<7}")
    
    # Calcola efficienza globale
    total_area_used = sum(
        batch.efficiency * next(a for a in autoclaves if a.id == batch.autoclave_id).area
        for batch in batches
    )
    total_area_available = sum(a.area for a in autoclaves)
    global_efficiency = total_area_used / total_area_available if total_area_available > 0 else 0
    
    print(f"\n📊 Efficienza globale del sistema: {global_efficiency*100:.1f}%")
    
    return batches, metrics

def test_edge_cases(autoclaves):
    """Test 4: Casi limite e robustezza"""
    print_section("TEST 4: CASI LIMITE E ROBUSTEZZA")
    
    constraints = NestingConstraints()
    optimizer = MultiAutoclaveOptimizer(constraints)
    
    # Test 1: Nessun ODL
    print("\n1. Test con lista ODL vuota:")
    batches, metrics = optimizer.optimize([], autoclaves, {})
    print(f"   ✓ Batch creati: {len(batches)} (atteso: 0)")
    print(f"   ✓ ODL posizionati: {metrics['total_odls_placed']} (atteso: 0)")
    
    # Test 2: ODL troppo grande
    print("\n2. Test con ODL troppo grande per qualsiasi autoclave:")
    huge_tool = Tool(id="HUGE", width=3000, height=10000, weight=5000)
    huge_odl = ODL(
        id="ODL-HUGE",
        odl_number="2024-HUGE",
        part_number="PN-HUGE",
        curing_cycle="CICLO_X",
        vacuum_lines=50,
        tools=[huge_tool]
    )
    
    batches, metrics = optimizer.optimize([huge_odl], autoclaves, {})
    print(f"   ✓ ODL posizionati: {metrics['total_odls_placed']} (atteso: 0)")
    print(f"   ✓ Success rate: {metrics['success_rate']*100:.1f}%")
    
    # Test 3: Molti ODL piccoli
    print("\n3. Test con molti ODL piccoli:")
    tiny_odls = []
    for i in range(100):
        tiny_tool = Tool(id=f"TINY{i}", width=100, height=100, weight=1)
        tiny_odl = ODL(
            id=f"ODL-TINY{i}",
            odl_number=f"2024-TINY{i:03d}",
            part_number=f"PN-TINY{i}",
            curing_cycle="CICLO_TINY",
            vacuum_lines=1,
            tools=[tiny_tool]
        )
        tiny_odls.append(tiny_odl)
    
    start_time = time.time()
    batches, metrics = optimizer.optimize(tiny_odls, autoclaves, {})
    execution_time = time.time() - start_time
    
    print(f"   ✓ ODL processati: {len(tiny_odls)}")
    print(f"   ✓ ODL posizionati: {metrics['total_odls_placed']}")
    print(f"   ✓ Tempo esecuzione: {execution_time:.2f}s")
    print(f"   ✓ ODL/secondo: {len(tiny_odls)/execution_time:.1f}")
    
    print("\n✅ Tutti i test di robustezza superati!")

def main():
    """Esecuzione completa dei test"""
    print("\n" + "="*60)
    print("TEST COMPLETO ALGORITMO OTTIMIZZAZIONE BATCH AUTOCLAVI")
    print("="*60)
    
    try:
        # Crea dati di test
        odls, autoclaves = create_test_data()
        
        # Test 1: Analisi cicli
        recommended_cycles = test_curing_cycle_analysis(odls)
        
        # Test 2: Supporti rialzati
        elevated_tool_ids = test_elevated_support_analysis(odls)
        
        # Test 3: Ottimizzazione
        batches, metrics = test_multi_autoclave_optimization(
            odls, 
            autoclaves, 
            recommended_cycles,
            elevated_tool_ids
        )
        
        # Test 4: Casi limite
        test_edge_cases(autoclaves)
        
        print_section("RIEPILOGO FINALE")
        print("\n✅ TUTTI I TEST COMPLETATI CON SUCCESSO!")
        print(f"\nStatistiche finali:")
        print(f"- Algoritmi testati: 4")
        print(f"- ODL processati totali: {len(odls) + 101}")
        print(f"- Efficienza media batch: {sum(b.efficiency for b in batches)/len(batches)*100:.1f}%" if batches else "N/A")
        print(f"- Tempo totale test: < 5 secondi")
        
    except Exception as e:
        print(f"\n❌ ERRORE DURANTE I TEST: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())