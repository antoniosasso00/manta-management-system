#!/usr/bin/env python3
"""
Test con Dataset Realistico per Validazione Efficienza
======================================================

Genera scenari con rapporto area ODL/autoclavi realistico per l'industria aerospaziale.
"""

import json
import time
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import requests

# Configurazione
MICROSERVICE_URL = "http://localhost:8000"
API_BASE = f"{MICROSERVICE_URL}/api/v1"

def print_header(title: str):
    print(f"\n{'='*60}")
    print(f"🎯 {title}")
    print(f"{'='*60}")

def print_section(title: str):
    print(f"\n📊 {title}")
    print("-" * 40)

def print_result(label: str, value: any, unit: str = ""):
    print(f"   ✅ {label}: {value}{unit}")

def print_improvement(before: float, after: float, metric: str):
    if before == 0:
        improvement = 0
    else:
        improvement = ((after - before) / before) * 100
    color = "🟢" if improvement > 0 else "🔴" if improvement < 0 else "🟡"
    print(f"   {color} {metric}: {improvement:+.1f}% ({before:.1f} → {after:.1f})")

def generate_realistic_scenario(target_utilization: float = 0.6) -> tuple:
    """
    Genera scenario realistico con utilizzo target delle autoclavi.
    target_utilization: percentuale di utilizzo totale delle autoclavi (0.6 = 60%)
    """
    
    # Autoclavi realistiche
    autoclaves = [
        {
            "id": "AC-001",
            "code": "AUTOCLAVE-GRANDE",
            "width": 4000,    # 4m x 2.5m = 10 m²
            "height": 2500,   
            "vacuum_lines": 6,
            "max_weight": 5000,
        },
        {
            "id": "AC-002", 
            "code": "AUTOCLAVE-MEDIA",
            "width": 3000,    # 3m x 2m = 6 m²
            "height": 2000,   
            "vacuum_lines": 4,
            "max_weight": 3000,
        },
        {
            "id": "AC-003",
            "code": "AUTOCLAVE-PICCOLA",
            "width": 2000,    # 2m x 1.5m = 3 m²
            "height": 1500,   
            "vacuum_lines": 2,
            "max_weight": 2000,
        }
    ]
    
    # Area totale autoclavi: 19 m²
    total_autoclave_area = sum(a["width"] * a["height"] for a in autoclaves) / 1000000
    target_odl_area = total_autoclave_area * target_utilization
    
    print_result("Area totale autoclavi", f"{total_autoclave_area:.1f}", " m²")
    print_result("Area target ODL", f"{target_odl_area:.1f}", " m² ({:.0%} utilizzo)".format(target_utilization))
    
    # Genera ODL per raggiungere target
    odls = []
    current_area = 0
    odl_count = 0
    
    # Dimensioni tipiche parti aerospaziali (più realistiche)
    typical_parts = [
        {"width": 1200, "height": 800},   # 0.96 m²
        {"width": 800, "height": 600},    # 0.48 m²
        {"width": 1500, "height": 1000},  # 1.5 m²
        {"width": 600, "height": 400},    # 0.24 m²
        {"width": 1000, "height": 700},   # 0.7 m²
        {"width": 400, "height": 300},    # 0.12 m²
    ]
    
    cycles = ["CICLO_STANDARD_180C", "CICLO_PESANTE_200C", "CICLO_RAPIDO_160C"]
    
    while current_area < target_odl_area:
        odl_count += 1
        part = random.choice(typical_parts)
        
        # Variabilità minima
        width = part["width"] + random.randint(-50, 50)
        height = part["height"] + random.randint(-25, 25)
        
        # 1-2 tools per ODL (tipico aerospazio)
        num_tools = random.choices([1, 2], weights=[70, 30])[0]
        
        tools = []
        for j in range(num_tools):
            tool = {
                "id": f"T{odl_count}_{j+1}",
                "width": width,   
                "height": height, 
                "weight": (width * height * 5) / 1000000,  # ~5mm spessore
            }
            tools.append(tool)
        
        odl_area = sum(t["width"] * t["height"] for t in tools) / 1000000
        
        # Se aggiungere questo ODL sforerebbe troppo il target, fermati
        if current_area + odl_area > target_odl_area * 1.1:  # Max 10% sopra target
            break
        
        odl = {
            "id": f"ODL-2024-{odl_count:03d}",
            "odl_number": f"ODL-2024-{odl_count:03d}",
            "part_number": f"PN-AERO-{odl_count:03d}",
            "curing_cycle": random.choice(cycles),
            "vacuum_lines": random.randint(1, 3),
            "tools": tools,
            "total_area": odl_area,
            "priority": random.choices(["NORMAL", "HIGH", "URGENT"], 
                                     weights=[60, 30, 10])[0],
            "due_date": (datetime.now() + timedelta(days=random.randint(7, 60))).isoformat(),
        }
        
        odls.append(odl)
        current_area += odl_area
    
    print_result("ODL generati", len(odls))
    print_result("Area effettiva ODL", f"{current_area:.1f}", " m²")
    print_result("Utilizzo teorico", f"{(current_area/total_autoclave_area)*100:.1f}", "%")
    
    return odls, autoclaves

def calculate_manual_planning(odls: List[Dict], autoclaves: List[Dict]) -> Dict:
    """Simula pianificazione manuale realistica"""
    
    # Raggruppa per ciclo
    cycle_groups = {}
    for odl in odls:
        cycle = odl["curing_cycle"]
        if cycle not in cycle_groups:
            cycle_groups[cycle] = []
        cycle_groups[cycle].append(odl)
    
    total_batches = 0
    total_area_used = 0
    total_area_available = 0
    unprocessed_odls = 0
    processing_time_hours = 0
    
    for cycle, cycle_odls in cycle_groups.items():
        # Ordina per priorità
        priority_order = {"URGENT": 3, "HIGH": 2, "NORMAL": 1}
        cycle_odls.sort(key=lambda x: priority_order[x["priority"]], reverse=True)
        
        # Riempi autoclavi (approccio manuale: target 70% riempimento)
        for autoclave in autoclaves:
            if not cycle_odls:
                break
                
            autoclave_area = (autoclave["width"] * autoclave["height"]) / 1000000
            target_area = autoclave_area * 0.7  # Target manuale 70%
            
            batch_area = 0
            batch_odls = []
            
            # Riempimento greedy
            i = 0
            while i < len(cycle_odls) and batch_area < target_area:
                odl = cycle_odls[i]
                if batch_area + odl["total_area"] <= target_area:
                    batch_odls.append(odl)
                    batch_area += odl["total_area"]
                    cycle_odls.pop(i)
                else:
                    i += 1
            
            if batch_odls:
                total_batches += 1
                total_area_used += batch_area
                total_area_available += autoclave_area
                processing_time_hours += random.randint(240, 480) / 60  # 4-8 ore
        
        unprocessed_odls += len(cycle_odls)
    
    overall_efficiency = (total_area_used / total_area_available) * 100 if total_area_available > 0 else 0
    
    return {
        "method": "Pianificazione Manuale",
        "total_batches": total_batches,
        "overall_efficiency": overall_efficiency,
        "total_processing_hours": processing_time_hours,
        "unprocessed_odls": unprocessed_odls,
        "total_area_used": total_area_used,
        "total_area_available": total_area_available,
    }

def test_microservice_optimization(odls: List[Dict], autoclaves: List[Dict]) -> Dict:
    """Testa ottimizzazione microservizio"""
    
    all_cycles = list(set(odl["curing_cycle"] for odl in odls))
    
    payload = {
        "odls": odls,
        "autoclaves": autoclaves, 
        "selected_cycles": all_cycles,
        "elevated_tools": [],
        "constraints": {
            "min_border_distance": 20,  # mm - ottimizzato
            "min_tool_distance": 15,    # mm - ottimizzato  
            "allow_rotation": True
        }
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_BASE}/optimization/execute",
            json=payload,
            timeout=60
        )
        optimization_time = time.time() - start_time
        
        if response.status_code != 200:
            return {"error": f"API error: {response.status_code}"}
            
        result = response.json()
        
        # Calcola metriche
        batches = result.get("batches", [])
        total_batches = len(batches)
        total_area_used = 0
        total_area_available = 0
        
        for batch in batches:
            area_efficiency = batch.get("metrics", {}).get("area_efficiency", 0) * 100
            
            # Trova area autoclave
            for autoclave in autoclaves:
                if autoclave["id"] == batch["autoclave_id"]:
                    autoclave_area = (autoclave["width"] * autoclave["height"]) / 1000000
                    used_area = autoclave_area * (area_efficiency / 100)
                    total_area_used += used_area
                    total_area_available += autoclave_area
                    break
        
        processed_odls = result.get("total_odls_placed", 0)
        unprocessed_odls = len(odls) - processed_odls
        overall_efficiency = (total_area_used / total_area_available) * 100 if total_area_available > 0 else 0
        total_processing_hours = total_batches * random.randint(240, 480) / 60
        
        return {
            "method": "Ottimizzazione Microservizio",
            "total_batches": total_batches,
            "overall_efficiency": overall_efficiency,
            "total_processing_hours": total_processing_hours,
            "unprocessed_odls": unprocessed_odls,
            "optimization_time": optimization_time,
            "success_rate": result.get("success_rate", 0),
            "total_area_used": total_area_used,
            "total_area_available": total_area_available,
            "raw_result": result
        }
        
    except Exception as e:
        return {"error": f"Request failed: {e}"}

def main():
    """Test con scenari realistici"""
    
    print_header("TEST EFFICIENZA CON DATASET REALISTICO")
    print("Scenari con rapporto area ODL/autoclavi realistico")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verifica microservizio
    try:
        response = requests.get(f"{API_BASE}/health/", timeout=5)
        if response.status_code == 200:
            print("✅ Microservizio operativo")
        else:
            print("❌ Microservizio non disponibile")
            return
    except Exception as e:
        print(f"❌ Connessione fallita: {e}")
        return
    
    # Test con diversi livelli di utilizzo
    utilization_scenarios = [
        (0.5, "Basso Carico (50% utilizzo)"),
        (0.7, "Carico Normale (70% utilizzo)"),
        (0.85, "Alto Carico (85% utilizzo)")
    ]
    
    results = {}
    
    for utilization, scenario_name in utilization_scenarios:
        print_header(f"SCENARIO: {scenario_name}")
        
        # Genera dataset realistico
        print_section("Generazione Dataset Realistico")
        odls, autoclaves = generate_realistic_scenario(utilization)
        
        # Test pianificazione manuale
        print_section("Pianificazione Manuale")
        manual_result = calculate_manual_planning(odls, autoclaves)
        
        print_result("Batch creati", manual_result["total_batches"])
        print_result("Efficienza spaziale", f"{manual_result['overall_efficiency']:.1f}", "%")
        print_result("Tempo processamento", f"{manual_result['total_processing_hours']:.1f}", " ore")
        print_result("ODL non processati", manual_result["unprocessed_odls"])
        
        # Test ottimizzazione microservizio
        print_section("Ottimizzazione Microservizio")
        ai_result = test_microservice_optimization(odls, autoclaves)
        
        if "error" in ai_result:
            print(f"❌ Errore: {ai_result['error']}")
            continue
            
        print_result("Batch creati", ai_result["total_batches"])
        print_result("Efficienza spaziale", f"{ai_result['overall_efficiency']:.1f}", "%")
        print_result("Tempo processamento", f"{ai_result['total_processing_hours']:.1f}", " ore")
        print_result("ODL non processati", ai_result["unprocessed_odls"])
        print_result("Tempo ottimizzazione", f"{ai_result['optimization_time']:.2f}", " secondi")
        print_result("Tasso successo", f"{ai_result['success_rate']:.1%}")
        
        # Analisi miglioramenti
        print_section("Analisi Miglioramenti")
        
        print_improvement(
            manual_result["overall_efficiency"], 
            ai_result["overall_efficiency"],
            "Efficienza Spaziale"
        )
        
        manual_throughput = (len(odls) - manual_result["unprocessed_odls"]) / manual_result["total_processing_hours"] if manual_result["total_processing_hours"] > 0 else 0
        ai_throughput = (len(odls) - ai_result["unprocessed_odls"]) / ai_result["total_processing_hours"] if ai_result["total_processing_hours"] > 0 else 0
        
        print_improvement(manual_throughput, ai_throughput, "Throughput (ODL/ora)")
        
        unprocessed_improvement = manual_result["unprocessed_odls"] - ai_result["unprocessed_odls"]
        if unprocessed_improvement > 0:
            print_result("ODL aggiuntivi processati", unprocessed_improvement)
        
        # Salva risultati
        results[scenario_name] = {
            "utilization": utilization,
            "manual": manual_result,
            "ai": ai_result,
            "efficiency_improvement": ai_result["overall_efficiency"] - manual_result["overall_efficiency"],
            "throughput_improvement": ai_throughput - manual_throughput
        }
    
    # Sommario finale
    print_header("SOMMARIO COMPLESSIVO")
    
    total_efficiency_improvement = 0
    total_throughput_improvement = 0
    positive_scenarios = 0
    
    for scenario_name, result in results.items():
        print_section(f"Scenario: {scenario_name}")
        
        efficiency_imp = result["efficiency_improvement"]
        throughput_imp = result["throughput_improvement"]
        
        print_result("Miglioramento efficienza", f"{efficiency_imp:+.1f}", "%")
        print_result("Miglioramento throughput", f"{throughput_imp:+.2f}", " ODL/ora")
        
        total_efficiency_improvement += efficiency_imp
        total_throughput_improvement += throughput_imp
        
        if efficiency_imp > 0:
            positive_scenarios += 1
    
    print_section("RISULTATO FINALE")
    
    avg_efficiency_improvement = total_efficiency_improvement / len(results) if results else 0
    avg_throughput_improvement = total_throughput_improvement / len(results) if results else 0
    
    print_result("MIGLIORAMENTO EFFICIENZA MEDIO", f"{avg_efficiency_improvement:+.1f}", "%")
    print_result("MIGLIORAMENTO THROUGHPUT MEDIO", f"{avg_throughput_improvement:+.2f}", " ODL/ora")
    print_result("SCENARI CON MIGLIORAMENTO", f"{positive_scenarios}/{len(results)}")
    
    # Valutazione finale
    print_header("VALUTAZIONE SISTEMA")
    
    if avg_efficiency_improvement > 10:
        print("🟢 ECCELLENTE: Miglioramento significativo dimostrato")
    elif avg_efficiency_improvement > 5:
        print("🟢 BUONO: Miglioramento apprezzabile")
    elif avg_efficiency_improvement > 0:
        print("🟡 MODERATO: Miglioramento presente ma limitato")
    elif avg_efficiency_improvement > -5:
        print("🟡 NEUTRALE: Performance paragonabile al manuale")
    else:
        print("🔴 INSUFFICIENTE: Performance inferiore al manuale")
    
    print(f"\n💡 Con dataset realistici, il microservizio dimostra")
    print(f"   un miglioramento medio dell'efficienza del {avg_efficiency_improvement:+.1f}%")
    print(f"   e del throughput di {avg_throughput_improvement:+.2f} ODL/ora")

if __name__ == "__main__":
    main()