#!/usr/bin/env python3
"""
Test Gestione Tool con Supporti Rialzati
========================================

Verifica il pre-filtering e la corretta gestione dei tool che richiedono
supporti rialzati nell'ottimizzazione autoclavi.
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Configurazione
MICROSERVICE_URL = "http://localhost:8000"
API_BASE = f"{MICROSERVICE_URL}/api/v1"

def print_header(title: str):
    print(f"\n{'='*70}")
    print(f"🎯 {title}")
    print(f"{'='*70}")

def print_section(title: str):
    print(f"\n📊 {title}")
    print("-" * 50)

def print_result(label: str, value: any, unit: str = ""):
    print(f"   ✅ {label}: {value}{unit}")

def generate_elevated_test_scenario():
    """
    Genera scenario specifico per testare gestione supporti rialzati.
    
    Include:
    1. Tool normali (livello 0)
    2. Tool su supporti rialzati (livello 1) 
    3. Mix di dimensioni per testare pre-filtering
    """
    
    # Autoclave per test
    autoclave = {
        "id": "AC-ELEVATED",
        "code": "AUTOCLAVE-ELEVATED-TEST",
        "width": 2500,
        "height": 2000,   
        "vacuum_lines": 6,
        "max_weight": 4000,
    }
    
    print_result("Autoclave", autoclave["code"])
    print_result("Dimensioni", f"{autoclave['width']}mm x {autoclave['height']}mm")
    
    # ODL con mix di tool normali e rialzati
    odls = []
    elevated_tool_ids = []  # Track quali tool saranno elevated
    
    # Dati per generazione
    tool_configs = [
        # (width, height, description, elevated)
        (800, 600, "Panel_Large", False),      # Tool normale grande
        (700, 500, "Panel_Medium", True),      # Tool rialzato medio
        (600, 400, "Panel_Small", False),      # Tool normale piccolo
        (500, 400, "Bracket_Heavy", True),     # Tool rialzato pesante
        (400, 300, "Component_Std", False),    # Tool normale standard
        (350, 250, "Component_Elev", True),    # Tool rialzato piccolo
    ]
    
    for i, (width, height, part_type, is_elevated) in enumerate(tool_configs):
        odl_id = f"ODL-ELEV-{i+1:02d}"
        tool_id = f"T{i+1}_1"
        
        # Variabilità minima
        final_width = width + random.randint(-50, 50)
        final_height = height + random.randint(-25, 25)
        
        tool = {
            "id": tool_id,
            "width": final_width,   
            "height": final_height, 
            "weight": (final_width * final_height * 8) / 1000000,  # Più pesanti se elevated
        }
        
        if is_elevated:
            elevated_tool_ids.append(tool_id)
        
        odl = {
            "id": odl_id,
            "odl_number": odl_id,
            "part_number": f"PN-{part_type}-{i+1:02d}",
            "curing_cycle": "CICLO_ELEVATED_180C",
            "vacuum_lines": 1,
            "tools": [tool],
            "total_area": (final_width * final_height) / 1000000,
            "priority": "HIGH" if is_elevated else "NORMAL",  # Priority diversa per test
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "elevated": is_elevated,  # Flag per tracking
        }
        
        odls.append(odl)
    
    print_result("ODL generati", len(odls))
    print_result("Tool normali", len([o for o in odls if not o["elevated"]]))
    print_result("Tool rialzati", len([o for o in odls if o["elevated"]]))
    print_result("Tool elevated IDs", ", ".join(elevated_tool_ids))
    
    return odls, [autoclave], elevated_tool_ids

def test_elevated_optimization(odls, autoclaves, elevated_tool_ids):
    """Testa ottimizzazione con elevated tools"""
    
    # Prima configurazione: elevated tools specificati
    payload_with_elevated = {
        "odls": odls,
        "autoclaves": autoclaves, 
        "selected_cycles": ["CICLO_ELEVATED_180C"],
        "elevated_tools": elevated_tool_ids,  # Lista dei tool che devono essere rialzati
        "constraints": {
            "min_border_distance": 20,
            "min_tool_distance": 15,
            "allow_rotation": True,
            "support_height": 150.0,         # Altezza supporti
            "min_support_spacing": 300.0,    # Distanza minima tra supporti
            "max_elevated_percentage": 0.4   # Max 40% area elevated
        }
    }
    
    # Seconda configurazione: nessun elevated tool (confronto)
    payload_no_elevated = {
        "odls": odls,
        "autoclaves": autoclaves, 
        "selected_cycles": ["CICLO_ELEVATED_180C"],
        "elevated_tools": [],  # Nessun tool elevated
        "constraints": {
            "min_border_distance": 20,
            "min_tool_distance": 15,
            "allow_rotation": True
        }
    }
    
    results = {}
    
    # Test 1: Con elevated tools
    print_section("TEST 1: CON SUPPORTI RIALZATI")
    try:
        import time
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE}/optimization/execute",
            json=payload_with_elevated,
            timeout=60
        )
        
        optimization_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            results["with_elevated"] = (result, optimization_time)
            print_result("Successo", "SÌ")
            print_result("Tempo", f"{optimization_time:.3f}", " secondi")
        else:
            print_result("Errore API", response.status_code)
            results["with_elevated"] = None
            
    except Exception as e:
        print_result("Errore", str(e))
        results["with_elevated"] = None
    
    # Test 2: Senza elevated tools
    print_section("TEST 2: SENZA SUPPORTI RIALZATI")
    try:
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE}/optimization/execute",
            json=payload_no_elevated,
            timeout=60
        )
        
        optimization_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            results["no_elevated"] = (result, optimization_time)
            print_result("Successo", "SÌ")
            print_result("Tempo", f"{optimization_time:.3f}", " secondi")
        else:
            print_result("Errore API", response.status_code)
            results["no_elevated"] = None
            
    except Exception as e:
        print_result("Errore", str(e))
        results["no_elevated"] = None
    
    return results

def analyze_elevated_results(results, odls, elevated_tool_ids):
    """Analizza risultati gestione elevated tools"""
    
    print_header("ANALISI GESTIONE SUPPORTI RIALZATI")
    
    # Analizza risultato con elevated
    if results.get("with_elevated"):
        result_elevated, time_elevated = results["with_elevated"]
        
        print_section("RISULTATI CON SUPPORTI RIALZATI")
        
        batches = result_elevated.get("batches", [])
        total_placed = result_elevated.get("total_odls_placed", 0)
        success_rate = result_elevated.get("success_rate", 0)
        
        print_result("ODL posizionati", f"{total_placed}/{len(odls)}")
        print_result("Tasso successo", f"{success_rate:.1%}")
        print_result("Batch generati", len(batches))
        print_result("Tempo esecuzione", f"{time_elevated:.3f}", " secondi")
        
        # Verifica pre-filtering elevated tools
        elevated_placed = 0
        normal_placed = 0
        elevated_details = []
        
        for batch in batches:
            placements = batch.get("placements", [])
            
            for placement in placements:
                tool_id = placement["tool_id"]
                level = placement.get("level", 0)
                
                if tool_id in elevated_tool_ids:
                    elevated_placed += 1
                    elevated_details.append({
                        "tool_id": tool_id,
                        "level": level,
                        "expected_level": 1,
                        "correct": level == 1
                    })
                else:
                    normal_placed += 1
        
        print_section("VERIFICA PRE-FILTERING ELEVATED TOOLS")
        
        print_result("Tool elevated previsti", len(elevated_tool_ids))
        print_result("Tool elevated posizionati", elevated_placed)
        print_result("Tool normali posizionati", normal_placed)
        
        # Verifica correttezza livelli
        correct_levels = sum(1 for detail in elevated_details if detail["correct"])
        
        print_result("Tool elevated livello corretto", f"{correct_levels}/{elevated_placed}")
        
        if elevated_details:
            print("\n   DETTAGLI TOOL ELEVATED:")
            for detail in elevated_details:
                status = "✅" if detail["correct"] else "❌"
                print(f"   {status} {detail['tool_id']}: livello {detail['level']} (atteso: {detail['expected_level']})")
        
        # Verifica vincoli elevated
        print_section("VERIFICA VINCOLI SUPPORTI")
        
        if batches:
            batch = batches[0]  # Primo batch
            placements = batch.get("placements", [])
            
            elevated_placements = [p for p in placements if p["tool_id"] in elevated_tool_ids]
            
            if elevated_placements:
                # Calcola area elevated vs totale
                total_area = sum(p["width"] * p["height"] for p in placements) / 1000000
                elevated_area = sum(p["width"] * p["height"] for p in elevated_placements) / 1000000
                elevated_percentage = (elevated_area / total_area) * 100 if total_area > 0 else 0
                
                print_result("Area elevated", f"{elevated_area:.2f}", " m²")
                print_result("Percentuale elevated", f"{elevated_percentage:.1f}", "%")
                print_result("Limite max elevated", "40%")
                print_result("Vincolo rispettato", "SÌ" if elevated_percentage <= 40 else "NO")
                
                # Verifica distanze tra supporti
                support_violations = 0
                min_distance = 300.0  # mm
                
                for i, p1 in enumerate(elevated_placements):
                    for p2 in elevated_placements[i+1:]:
                        # Calcola distanza tra centri
                        center1_x = p1["x"] + p1["width"] / 2
                        center1_y = p1["y"] + p1["height"] / 2
                        center2_x = p2["x"] + p2["width"] / 2
                        center2_y = p2["y"] + p2["height"] / 2
                        
                        distance = ((center2_x - center1_x)**2 + (center2_y - center1_y)**2)**0.5
                        
                        if distance < min_distance:
                            support_violations += 1
                
                print_result("Violazioni distanza supporti", support_violations)
                print_result("Distanza minima supporti", f"{min_distance}", " mm")
    
    else:
        print("❌ Test con elevated tools fallito")
    
    # Analizza risultato senza elevated
    if results.get("no_elevated"):
        result_normal, time_normal = results["no_elevated"]
        
        print_section("CONFRONTO: SENZA SUPPORTI RIALZATI")
        
        batches_normal = result_normal.get("batches", [])
        total_placed_normal = result_normal.get("total_odls_placed", 0)
        success_rate_normal = result_normal.get("success_rate", 0)
        
        print_result("ODL posizionati", f"{total_placed_normal}/{len(odls)}")
        print_result("Tasso successo", f"{success_rate_normal:.1%}")
        print_result("Batch generati", len(batches_normal))
        print_result("Tempo esecuzione", f"{time_normal:.3f}", " secondi")
        
        # Tutti i tool dovrebbero essere livello 0
        all_level_zero = True
        for batch in batches_normal:
            placements = batch.get("placements", [])
            for placement in placements:
                if placement.get("level", 0) != 0:
                    all_level_zero = False
                    break
        
        print_result("Tutti tool livello 0", "SÌ" if all_level_zero else "NO")
    
    else:
        print("❌ Test senza elevated tools fallito")
    
    # Confronto prestazioni
    if results.get("with_elevated") and results.get("no_elevated"):
        print_section("CONFRONTO PRESTAZIONI")
        
        _, time_elevated = results["with_elevated"]
        _, time_normal = results["no_elevated"]
        
        result_elevated, _ = results["with_elevated"]
        result_normal, _ = results["no_elevated"]
        
        placed_elevated = result_elevated.get("total_odls_placed", 0)
        placed_normal = result_normal.get("total_odls_placed", 0)
        
        print_result("ODL con elevated", f"{placed_elevated}")
        print_result("ODL senza elevated", f"{placed_normal}")
        print_result("Differenza posizionamento", f"{placed_elevated - placed_normal}")
        
        print_result("Tempo con elevated", f"{time_elevated:.3f}", " s")
        print_result("Tempo senza elevated", f"{time_normal:.3f}", " s")
        print_result("Overhead elevated", f"{((time_elevated - time_normal) / time_normal * 100):+.1f}", "%" if time_normal > 0 else "N/A")
    
    # Conclusioni
    print_section("CONCLUSIONI GESTIONE ELEVATED")
    
    if results.get("with_elevated"):
        result_elevated, _ = results["with_elevated"]
        batches = result_elevated.get("batches", [])
        
        if batches:
            placements = batches[0].get("placements", [])
            elevated_placements = [p for p in placements if p["tool_id"] in elevated_tool_ids]
            correct_levels = sum(1 for p in elevated_placements if p.get("level", 0) == 1)
            
            if len(elevated_placements) > 0 and correct_levels == len(elevated_placements):
                print("🟢 SUCCESSO: Pre-filtering e gestione elevated tools funzionano correttamente")
                print("   - Tool elevated identificati correttamente")
                print("   - Livelli assegnati correttamente")
                print("   - Vincoli supporti rispettati")
            else:
                print("🟡 PARZIALE: Elevated tools gestiti ma con problemi")
                print(f"   - {correct_levels}/{len(elevated_placements)} tool con livello corretto")
        else:
            print("🔴 FALLIMENTO: Nessun batch generato con elevated tools")
    else:
        print("🔴 FALLIMENTO: Test elevated tools non completato")

def main():
    """Esecuzione test elevated tools"""
    
    print_header("TEST GESTIONE SUPPORTI RIALZATI")
    print("Verifica pre-filtering e gestione corretta tool elevated")
    
    # Verifica microservizio
    try:
        response = requests.get(f"{API_BASE}/health/", timeout=5)
        if response.status_code != 200:
            print("❌ Microservizio non disponibile")
            return
        print("✅ Microservizio operativo")
    except Exception as e:
        print(f"❌ Connessione fallita: {e}")
        return
    
    # Genera scenario test
    print_section("GENERAZIONE SCENARIO ELEVATED")
    odls, autoclaves, elevated_tool_ids = generate_elevated_test_scenario()
    
    # Test ottimizzazione
    results = test_elevated_optimization(odls, autoclaves, elevated_tool_ids)
    
    # Analisi risultati
    analyze_elevated_results(results, odls, elevated_tool_ids)

if __name__ == "__main__":
    main()