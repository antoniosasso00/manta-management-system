#!/usr/bin/env python3
"""
Test semplificato senza dipendenze esterne per verificare la logica base
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from domain.entities import Tool, ODL, Autoclave
from core.pre_filters.curing_cycle_filter import CuringCycleFilter
from core.pre_filters.elevated_support_filter import ElevatedSupportFilter

def test_basic_functionality():
    print("=== TEST FUNZIONALITÀ BASE ===\n")
    
    # Test 1: Entità di dominio
    print("1. Test creazione entità:")
    tool = Tool(id="T1", width=500, height=600, weight=10)
    print(f"   Tool creato: {tool.id}, area={tool.area/1000000:.2f}m², aspect={tool.aspect_ratio:.2f}")
    
    odl = ODL(
        id="ODL1",
        odl_number="2024-001",
        part_number="PN-123",
        curing_cycle="CICLO_A",
        vacuum_lines=2,
        tools=[tool]
    )
    print(f"   ODL creato: {odl.odl_number}, ciclo={odl.curing_cycle}, area={odl.total_area/1000000:.2f}m²")
    
    autoclave = Autoclave(
        id="AC1",
        code="AC-001",
        width=1900,
        height=8000,
        vacuum_lines=20
    )
    print(f"   Autoclave creata: {autoclave.code}, area={autoclave.area/1000000:.2f}m²")
    
    # Test 2: Analisi cicli di cura
    print("\n2. Test analisi cicli di cura:")
    
    # Crea ODL di test
    odls = []
    for i in range(10):
        cycle = "CICLO_A" if i < 6 else "CICLO_B"
        t = Tool(id=f"T{i}", width=300+i*50, height=400+i*50, weight=5+i)
        o = ODL(
            id=f"ODL{i}",
            odl_number=f"2024-{i:03d}",
            part_number=f"PN-{i}",
            curing_cycle=cycle,
            vacuum_lines=2,
            tools=[t]
        )
        odls.append(o)
    
    groups, recommendations = CuringCycleFilter.analyze_cycles(odls)
    
    print(f"   Trovati {len(groups)} gruppi di cicli:")
    for group in groups:
        print(f"   - {group.cycle_code}: {group.odl_count} ODL, score={group.optimization_score:.3f}")
    print(f"   Cicli raccomandati: {recommendations}")
    
    # Test 3: Analisi supporti rialzati
    print("\n3. Test analisi supporti rialzati:")
    
    elevated_by_odl, space_saved = ElevatedSupportFilter.analyze_elevated_candidates(odls)
    total_elevated = sum(len(tools) for tools in elevated_by_odl.values())
    
    print(f"   Tool elevati: {total_elevated}/{len(odls)}")
    print(f"   Spazio risparmiato: {space_saved:.1f}%")
    
    # Test 4: Verifica algoritmo greedy base
    print("\n4. Test algoritmo placement base (senza OR-Tools):")
    
    # Simula un placement greedy semplice
    autoclave_area = autoclave.area
    used_area = 0
    placed_count = 0
    
    for odl in odls[:5]:  # Prova con primi 5 ODL
        for tool in odl.tools:
            if used_area + tool.area < autoclave_area * 0.8:  # Max 80% utilizzo
                used_area += tool.area
                placed_count += 1
    
    efficiency = used_area / autoclave_area if autoclave_area > 0 else 0
    print(f"   Pezzi posizionati: {placed_count}")
    print(f"   Efficienza stimata: {efficiency*100:.1f}%")
    
    print("\n✅ Test base completati con successo!")
    print("\n⚠️  NOTA: Per il test completo con ottimizzazione CP-SAT")
    print("   è necessario installare OR-Tools:")
    print("   pip install ortools")

if __name__ == "__main__":
    test_basic_functionality()