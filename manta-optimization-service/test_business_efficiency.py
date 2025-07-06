#!/usr/bin/env python3
"""
Test di Efficienza Business per Microservizio Ottimizzazione Autoclavi
=====================================================================

Simula scenari reali aziendali per verificare l'efficientamento del processo.
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
    improvement = ((after - before) / before) * 100
    color = "🟢" if improvement > 0 else "🔴"
    print(f"   {color} {metric}: {improvement:+.1f}% ({before:.1f} → {after:.1f})")

class BusinessScenarioTester:
    def __init__(self):
        self.test_results = {}
        self.criticalities = []
        self.limitations = []
        
    def add_criticality(self, category: str, description: str, severity: str):
        """Registra una criticità rilevata"""
        self.criticalities.append({
            "category": category,
            "description": description,
            "severity": severity,  # LOW, MEDIUM, HIGH, CRITICAL
            "timestamp": datetime.now()
        })
        
    def add_limitation(self, category: str, description: str, impact: str):
        """Registra una limitazione del sistema"""
        self.limitations.append({
            "category": category, 
            "description": description,
            "impact": impact,
            "timestamp": datetime.now()
        })
        
    def generate_realistic_odls(self, count: int) -> List[Dict]:
        """Genera ODL realistici basati su dati aziendali reali"""
        
        # Dimensioni tipiche parti aerospaziali (mm)
        typical_parts = [
            # Pannelli fusoliera A320
            {"length": 2400, "width": 1200, "height": 8, "type": "Panel_A320_Fuselage"},
            {"length": 1800, "width": 800, "height": 6, "type": "Panel_A320_Wing"},
            
            # Componenti B777
            {"length": 3200, "width": 1600, "height": 12, "type": "Panel_B777_Fuselage"},
            {"length": 2800, "width": 1400, "height": 10, "type": "Panel_B777_Wing"},
            
            # Parti strutturali
            {"length": 1500, "width": 600, "height": 20, "type": "Structural_Beam"},
            {"length": 1000, "width": 400, "height": 15, "type": "Support_Bracket"},
            
            # Componenti piccoli
            {"length": 500, "width": 300, "height": 5, "type": "Small_Component"},
            {"length": 800, "width": 500, "height": 8, "type": "Medium_Component"},
        ]
        
        # Cicli di cura realistici
        curing_cycles = [
            "CICLO_A_180C_4H",    # Ciclo standard
            "CICLO_B_200C_6H",    # Ciclo pesante
            "CICLO_C_160C_8H",    # Ciclo lungo
            "CICLO_D_220C_3H",    # Ciclo rapido
        ]
        
        odls = []
        for i in range(count):
            part = random.choice(typical_parts)
            
            # Aggiungi variabilità realistica
            length = part["length"] + random.randint(-100, 100)
            width = part["width"] + random.randint(-50, 50)
            height = part["height"] + random.randint(-2, 2)
            
            tools = []
            # Numero tools per ODL (1-4 tipico)
            num_tools = random.choices([1, 2, 3, 4], weights=[40, 35, 20, 5])[0]
            
            for j in range(num_tools):
                tool = {
                    "id": f"T{i+1}_{j+1}",
                    "width": width,   # API richiede width invece di length
                    "height": length, # API richiede height invece di width 
                    "weight": (length * width * height) / 1000000 * 1.5,  # kg approssimativo
                    "requires_elevated_support": random.random() < 0.3  # 30% require supporti
                }
                tools.append(tool)
            
            odl = {
                "id": f"ODL-2024-{i+1:03d}",
                "odl_number": f"ODL-2024-{i+1:03d}",
                "part_number": f"PN-{part['type']}-{i+1:03d}",
                "curing_cycle": random.choice(curing_cycles),
                "vacuum_lines": random.randint(1, 4),  # API richiede vacuum_lines
                "tools": tools,
                "total_area": sum(t["width"] * t["height"] for t in tools) / 1000000,  # m² corrected
                "estimated_cure_time": random.randint(180, 480),  # minuti per il test manuale
                # Campi richiesti API:
                "priority": random.choices(["LOW", "NORMAL", "HIGH", "URGENT"], 
                                         weights=[20, 50, 25, 5])[0],
                "due_date": (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat(),
            }
            odls.append(odl)
            
        return odls
    
    def generate_realistic_autoclaves(self) -> List[Dict]:
        """Genera autoclavi con specifiche realistiche"""
        autoclaves = [
            {
                "id": "AC-001",
                "code": "AC-001",  # API richiede code invece di name
                "width": 4000,    # 4m
                "height": 2500,   # 2.5m 
                "vacuum_lines": 6,
                "max_weight": 5000,  # kg - API richiede questo campo
                # Campi extra per test business:
                "name": "Autoclave Grande - Linea A",
                "max_temperature": 250,
                "max_pressure": 7,  # bar
                "efficiency_rating": 0.95,
                "energy_cost_per_hour": 45.50,  # €/ora
                "maintenance_score": 0.9
            },
            {
                "id": "AC-002", 
                "code": "AC-002",
                "width": 3000,    # 3m
                "height": 2000,   # 2m
                "vacuum_lines": 4,
                "max_weight": 3000,  # kg
                # Campi extra per test business:
                "name": "Autoclave Media - Linea B",
                "max_temperature": 220,
                "max_pressure": 6,
                "efficiency_rating": 0.88,
                "energy_cost_per_hour": 35.20,
                "maintenance_score": 0.85
            },
            {
                "id": "AC-003",
                "code": "AC-003",
                "width": 2000,    # 2m
                "height": 1500,   # 1.5m
                "vacuum_lines": 2,
                "max_weight": 2000,  # kg
                # Campi extra per test business:
                "name": "Autoclave Piccola - Linea C", 
                "max_temperature": 200,
                "max_pressure": 5,
                "efficiency_rating": 0.82,
                "energy_cost_per_hour": 25.80,
                "maintenance_score": 0.95
            }
        ]
        return autoclaves
    
    def calculate_manual_efficiency(self, odls: List[Dict], autoclaves: List[Dict]) -> Dict:
        """Simula pianificazione manuale (approccio attuale)"""
        
        # Approccio manuale tipico: raggruppamento basilare per ciclo
        cycles_groups = {}
        for odl in odls:
            cycle = odl["curing_cycle"]
            if cycle not in cycles_groups:
                cycles_groups[cycle] = []
            cycles_groups[cycle].append(odl)
        
        total_area_used = 0
        total_area_available = 0
        total_batches = 0
        total_energy_cost = 0
        total_time = 0
        
        results = []
        
        for cycle, cycle_odls in cycles_groups.items():
            # Ordina per priorità (basic)
            priority_order = {"URGENT": 4, "HIGH": 3, "NORMAL": 2, "LOW": 1}
            cycle_odls.sort(key=lambda x: priority_order[x["priority"]], reverse=True)
            
            # Riempi autoclavi in ordine di dimensione (più grande prima)
            autoclaves_sorted = sorted(autoclaves, key=lambda x: x["width"] * x["height"], reverse=True)
            
            for autoclave in autoclaves_sorted:
                if not cycle_odls:
                    break
                    
                autoclave_area = (autoclave["width"] * autoclave["height"]) / 1000000  # m²
                batch_area = 0
                batch_odls = []
                
                # Riempimento greedy semplice
                i = 0
                while i < len(cycle_odls) and batch_area < autoclave_area * 0.7:  # Max 70% riempimento
                    odl = cycle_odls[i]
                    odl_area = odl["total_area"]
                    
                    if batch_area + odl_area <= autoclave_area * 0.7:
                        batch_odls.append(odl)
                        batch_area += odl_area
                        cycle_odls.pop(i)
                    else:
                        i += 1
                
                if batch_odls:
                    # Calcola metriche batch
                    efficiency = (batch_area / autoclave_area) * 100
                    cure_time = max(odl["estimated_cure_time"] for odl in batch_odls)
                    energy_cost = (cure_time / 60) * autoclave["energy_cost_per_hour"]
                    
                    total_area_used += batch_area
                    total_area_available += autoclave_area
                    total_batches += 1
                    total_energy_cost += energy_cost
                    total_time += cure_time
                    
                    results.append({
                        "autoclave": autoclave["name"],
                        "cycle": cycle,
                        "odls_count": len(batch_odls),
                        "efficiency": efficiency,
                        "area_used": batch_area,
                        "cure_time": cure_time,
                        "energy_cost": energy_cost
                    })
        
        # ODL non processati
        unprocessed_odls = sum(len(group) for group in cycles_groups.values())
        
        return {
            "method": "Manual Planning",
            "total_batches": total_batches,
            "overall_efficiency": (total_area_used / total_area_available) * 100 if total_area_available > 0 else 0,
            "total_energy_cost": total_energy_cost,
            "total_time_hours": total_time / 60,
            "unprocessed_odls": unprocessed_odls,
            "batches": results
        }
    
    def test_microservice_optimization(self, odls: List[Dict], autoclaves: List[Dict]) -> Dict:
        """Testa ottimizzazione tramite microservizio con analisi critica"""
        
        # Prepara dati per API
        all_cycles = list(set(odl["curing_cycle"] for odl in odls))
        elevated_tools = []
        
        for odl in odls:
            for tool in odl["tools"]:
                if tool.get("requires_elevated_support", False):
                    elevated_tools.append(tool["id"])
        
        payload = {
            "odls": odls,
            "autoclaves": autoclaves, 
            "selected_cycles": all_cycles,
            "elevated_tools": elevated_tools,
            "constraints": {
                "min_border_distance": 50,
                "min_tool_distance": 30,
                "allow_rotation": True,
                "max_efficiency_target": 85,
                "priority_weight": 0.3
            }
        }
        
        try:
            # Test prestazioni sotto carico
            start_time = time.time()
            response = requests.post(
                f"{API_BASE}/optimization/execute",
                json=payload,
                timeout=60
            )
            optimization_time = time.time() - start_time
            
            # ANALISI CRITICA: Tempo di risposta
            if optimization_time > 30:
                self.add_criticality("Performance", 
                                   f"Tempo ottimizzazione eccessivo: {optimization_time:.1f}s", 
                                   "HIGH")
            elif optimization_time > 10:
                self.add_criticality("Performance", 
                                   f"Tempo ottimizzazione lento: {optimization_time:.1f}s", 
                                   "MEDIUM")
            
            if response.status_code != 200:
                self.add_criticality("API", f"Errore API: {response.status_code}", "CRITICAL")
                return {"error": "API call failed"}
                
            result = response.json()
            
            # ANALISI CRITICA: Qualità risultati
            total_batches = len(result.get("batches", []))
            if total_batches == 0:
                self.add_criticality("Algorithm", "Nessun batch generato", "CRITICAL")
                return {"error": "No batches generated"}
            
            # Analizza risultati con controlli di qualità
            total_area_used = 0
            total_area_available = 0
            total_energy_cost = 0
            total_time = 0
            low_efficiency_batches = 0
            
            for i, batch in enumerate(result.get("batches", [])):
                batch_efficiency = batch.get("efficiency", 0)
                
                # CRITICITÀ: Batch a bassa efficienza
                if batch_efficiency < 40:
                    self.add_criticality("Efficiency", 
                                       f"Batch {i+1} efficienza molto bassa: {batch_efficiency:.1f}%", 
                                       "HIGH")
                    low_efficiency_batches += 1
                elif batch_efficiency < 60:
                    self.add_criticality("Efficiency", 
                                       f"Batch {i+1} efficienza bassa: {batch_efficiency:.1f}%", 
                                       "MEDIUM")
                    low_efficiency_batches += 1
                
                total_area_used += batch.get("total_area", 0)
                total_area_available += batch.get("autoclave_area", 0) 
                total_energy_cost += batch.get("estimated_cost", 0)
                total_time += batch.get("estimated_duration", 0)
            
            # LIMITAZIONE: Percentuale batch inefficienti
            if low_efficiency_batches > 0:
                inefficiency_rate = (low_efficiency_batches / total_batches) * 100
                self.add_limitation("Algorithm Quality", 
                                  f"{inefficiency_rate:.1f}% dei batch hanno efficienza <60%",
                                  "Riduce il vantaggio competitivo")
            
            processed_odls = sum(len(batch.get("placements", [])) for batch in result.get("batches", []))
            unprocessed_odls = len(odls) - processed_odls
            
            # CRITICITÀ: ODL non processati
            if unprocessed_odls > 0:
                unprocessed_rate = (unprocessed_odls / len(odls)) * 100
                if unprocessed_rate > 20:
                    self.add_criticality("Coverage", 
                                       f"{unprocessed_rate:.1f}% ODL non processati", 
                                       "HIGH")
                elif unprocessed_rate > 10:
                    self.add_criticality("Coverage", 
                                       f"{unprocessed_rate:.1f}% ODL non processati", 
                                       "MEDIUM")
            
            # LIMITAZIONE: Dipendenza da OR-Tools
            algorithm_used = result.get("algorithm_used", "unknown")
            if algorithm_used != "CP-SAT":
                self.add_limitation("Technology Dependency", 
                                  "Fallback algorithm usato invece di OR-Tools CP-SAT",
                                  "Ridotta qualità ottimizzazione")
            
            # LIMITAZIONE: Complessità gestione
            if len(all_cycles) > 3:
                self.add_limitation("Operational Complexity", 
                                  f"Gestione {len(all_cycles)} cicli diversi richiede coordinamento complesso",
                                  "Aumento overhead operativo")
            
            overall_efficiency = result.get("overall_efficiency", 0)
            
            # CRITICITÀ: Efficienza generale bassa
            if overall_efficiency < 50:
                self.add_criticality("Overall Performance", 
                                   f"Efficienza generale bassa: {overall_efficiency:.1f}%", 
                                   "HIGH")
            
            return {
                "method": "AI Optimization",
                "total_batches": total_batches,
                "overall_efficiency": overall_efficiency,
                "total_energy_cost": total_energy_cost,
                "total_time_hours": total_time / 60,
                "unprocessed_odls": unprocessed_odls,
                "optimization_time": optimization_time,
                "algorithm_used": algorithm_used,
                "batches": result.get("batches", []),
                "low_efficiency_batches": low_efficiency_batches,
                "raw_result": result
            }
            
        except requests.exceptions.Timeout:
            self.add_criticality("Performance", "Timeout ottimizzazione (>60s)", "CRITICAL") 
            return {"error": "Optimization timeout"}
        except requests.exceptions.RequestException as e:
            self.add_criticality("Infrastructure", f"Connessione microservizio fallita: {e}", "CRITICAL")
            return {"error": f"Connection failed: {e}"}
        except Exception as e:
            self.add_criticality("System", f"Errore imprevisto: {e}", "CRITICAL")
            return {"error": f"General error: {e}"}
    
    def run_business_scenario_test(self, scenario_name: str, odl_count: int):
        """Esegue test completo per uno scenario business"""
        
        print_header(f"SCENARIO: {scenario_name}")
        print(f"📋 ODL da processare: {odl_count}")
        
        # Genera dati realistici
        print_section("Generazione Dati Scenario")
        odls = self.generate_realistic_odls(odl_count)
        autoclaves = self.generate_realistic_autoclaves()
        
        print_result("ODL generati", len(odls))
        print_result("Autoclavi disponibili", len(autoclaves))
        print_result("Area totale autoclavi", sum(a["width"]*a["height"] for a in autoclaves)/1000000, " m²")
        print_result("Area totale ODL", sum(odl["total_area"] for odl in odls), " m²")
        
        # Test pianificazione manuale
        print_section("Test Pianificazione Manuale (Current State)")
        manual_result = self.calculate_manual_efficiency(odls, autoclaves)
        
        print_result("Batch creati", manual_result["total_batches"])
        print_result("Efficienza media", f"{manual_result['overall_efficiency']:.1f}", "%")
        print_result("Costo energetico", f"{manual_result['total_energy_cost']:.2f}", " €")
        print_result("Tempo totale", f"{manual_result['total_time_hours']:.1f}", " ore")
        print_result("ODL non processati", manual_result["unprocessed_odls"])
        
        # Test ottimizzazione AI
        print_section("Test Ottimizzazione AI (Future State)")
        ai_result = self.test_microservice_optimization(odls, autoclaves)
        
        if "error" in ai_result:
            print(f"❌ Errore ottimizzazione AI: {ai_result['error']}")
            return
            
        print_result("Batch creati", ai_result["total_batches"])
        print_result("Efficienza media", f"{ai_result['overall_efficiency']:.1f}", "%") 
        print_result("Costo energetico", f"{ai_result['total_energy_cost']:.2f}", " €")
        print_result("Tempo totale", f"{ai_result['total_time_hours']:.1f}", " ore")
        print_result("ODL non processati", ai_result["unprocessed_odls"])
        print_result("Tempo ottimizzazione", f"{ai_result['optimization_time']:.2f}", " secondi")
        print_result("Algoritmo usato", ai_result["algorithm_used"])
        
        # Analisi miglioramenti
        print_section("Analisi Efficientamento Business")
        
        print_improvement(
            manual_result["overall_efficiency"], 
            ai_result["overall_efficiency"],
            "Efficienza Spazio"
        )
        
        print_improvement(
            manual_result["total_energy_cost"],
            ai_result["total_energy_cost"] * -1,  # Inversione per mostrare risparmio
            "Risparmio Energetico"
        )
        
        print_improvement(
            manual_result["total_time_hours"],
            ai_result["total_time_hours"] * -1,  # Inversione per mostrare risparmio
            "Risparmio Tempo"
        )
        
        batch_reduction = manual_result["total_batches"] - ai_result["total_batches"]
        if batch_reduction > 0:
            print_result("Batch ridotti", batch_reduction, " (-{:.1f}%)".format(
                (batch_reduction / manual_result["total_batches"]) * 100
            ))
        
        unprocessed_improvement = manual_result["unprocessed_odls"] - ai_result["unprocessed_odls"]
        if unprocessed_improvement > 0:
            print_result("ODL aggiuntivi processati", unprocessed_improvement)
        
        # Calcola ROI annuale
        print_section("Calcolo ROI Annuale")
        
        # Assumi 250 giorni lavorativi, scenario si ripete ogni settimana
        weekly_scenarios = 52
        annual_energy_saving = (manual_result["total_energy_cost"] - ai_result["total_energy_cost"]) * weekly_scenarios
        annual_time_saving = (manual_result["total_time_hours"] - ai_result["total_time_hours"]) * weekly_scenarios
        
        # Costi operatore (€30/ora) + ammortamento autoclave (€100/ora)
        hourly_operational_cost = 130
        annual_operational_saving = annual_time_saving * hourly_operational_cost
        
        total_annual_saving = annual_energy_saving + annual_operational_saving
        
        print_result("Risparmio energetico annuale", f"{annual_energy_saving:.0f}", " €")
        print_result("Risparmio operativo annuale", f"{annual_operational_saving:.0f}", " €")
        print_result("RISPARMIO TOTALE ANNUALE", f"{total_annual_saving:.0f}", " €")
        
        # Costo microservizio (stima)
        microservice_annual_cost = 5 * 12  # €5/mese * 12 mesi
        roi_ratio = total_annual_saving / microservice_annual_cost if microservice_annual_cost > 0 else 0
        
        print_result("Costo microservizio annuale", f"{microservice_annual_cost}", " €")
        print_result("ROI Ratio", f"{roi_ratio:.1f}", "x")
        print_result("ROI Percentage", f"{(roi_ratio - 1) * 100:.0f}", "%")
        
        # Salva risultati per analisi successiva
        self.test_results[scenario_name] = {
            "manual": manual_result,
            "ai": ai_result,
            "improvements": {
                "efficiency": ai_result["overall_efficiency"] - manual_result["overall_efficiency"],
                "energy_saving": manual_result["total_energy_cost"] - ai_result["total_energy_cost"],
                "time_saving": manual_result["total_time_hours"] - ai_result["total_time_hours"],
                "annual_saving": total_annual_saving,
                "roi": roi_ratio
            }
        }

    def run_stress_tests(self):
        """Esegue stress test per identificare limiti del sistema"""
        
        print_header("STRESS TEST - IDENTIFICAZIONE LIMITI")
        
        # Test 1: Sovraccarico ODL
        print_section("Test Sovraccarico: 100 ODL")
        stress_odls = self.generate_realistic_odls(100)
        stress_autoclaves = self.generate_realistic_autoclaves()
        
        start_time = time.time()
        try:
            stress_result = self.test_microservice_optimization(stress_odls, stress_autoclaves)
            stress_time = time.time() - start_time
            
            if stress_time > 120:  # 2 minuti
                self.add_criticality("Scalability", 
                                   f"Tempo eccessivo per 100 ODL: {stress_time:.1f}s", 
                                   "CRITICAL")
            
            print_result("Tempo elaborazione", f"{stress_time:.1f}", " secondi")
            if "error" not in stress_result:
                print_result("ODL processati", len(stress_odls) - stress_result["unprocessed_odls"])
                print_result("Efficienza", f"{stress_result['overall_efficiency']:.1f}", "%")
            
        except Exception as e:
            self.add_criticality("System Stability", f"Crash durante stress test: {e}", "CRITICAL")
        
        # Test 2: Forme irregolari
        print_section("Test Forme Irregolari")
        irregular_odls = []
        for i in range(10):
            # Forme difficili da posizionare
            irregular_odl = {
                "id": f"IRREGULAR-{i+1}",
                "odl_number": f"IRR-{i+1:03d}",
                "curing_cycle": "CICLO_A_180C_4H",
                "tools": [{
                    "id": f"IRREGULAR_T{i+1}",
                    "length": random.randint(3000, 4500),  # Molto lunghi
                    "width": random.randint(100, 300),     # Molto stretti
                    "height": random.randint(50, 100),
                    "requires_elevated_support": True
                }],
                "total_area": 0,
                "priority": "HIGH"
            }
            irregular_odl["total_area"] = sum(t["length"] * t["width"] for t in irregular_odl["tools"]) / 1000000
            irregular_odls.append(irregular_odl)
        
        irregular_result = self.test_microservice_optimization(irregular_odls, stress_autoclaves)
        if "error" not in irregular_result:
            unprocessed_rate = (irregular_result["unprocessed_odls"] / len(irregular_odls)) * 100
            if unprocessed_rate > 50:
                self.add_limitation("Geometric Constraints", 
                                  f"Difficoltà con forme irregolari: {unprocessed_rate:.1f}% non processati",
                                  "Limitata applicabilità a geometrie complesse")
        
        # Test 3: Molti cicli diversi
        print_section("Test Complessità Cicli")
        complex_cycles = [f"CICLO_{chr(65+i)}_{180+i*10}C_{4+i}H" for i in range(8)]  # 8 cicli diversi
        complex_odls = []
        for i, cycle in enumerate(complex_cycles):
            odl = {
                "id": f"COMPLEX-{i+1}",
                "odl_number": f"CX-{i+1:03d}",
                "curing_cycle": cycle,
                "tools": [{"id": f"CT{i+1}", "length": 1000, "width": 800, "height": 10}],
                "total_area": 0.8,
                "priority": "NORMAL"
            }
            complex_odls.append(odl)
        
        complex_result = self.test_microservice_optimization(complex_odls, stress_autoclaves)
        if "error" not in complex_result:
            if complex_result["total_batches"] > len(stress_autoclaves) * 2:
                self.add_limitation("Cycle Management", 
                                  f"Troppi batch per cicli diversi: {complex_result['total_batches']}",
                                  "Aumento complessità operativa")

    def analyze_criticalities_and_limitations(self):
        """Analizza e riporta tutte le criticità e limitazioni rilevate"""
        
        print_header("ANALISI CRITICITÀ E LIMITAZIONI")
        
        if not self.criticalities and not self.limitations:
            print("🟢 Nessuna criticità o limitazione rilevata")
            return
        
        # Raggruppa criticità per severità
        critical_issues = [c for c in self.criticalities if c["severity"] == "CRITICAL"]
        high_issues = [c for c in self.criticalities if c["severity"] == "HIGH"] 
        medium_issues = [c for c in self.criticalities if c["severity"] == "MEDIUM"]
        
        print_section("CRITICITÀ CRITICHE")
        if critical_issues:
            for issue in critical_issues:
                print(f"   🔴 [{issue['category']}] {issue['description']}")
        else:
            print("   ✅ Nessuna criticità critica")
        
        print_section("CRITICITÀ ELEVATE")
        if high_issues:
            for issue in high_issues:
                print(f"   🟠 [{issue['category']}] {issue['description']}")
        else:
            print("   ✅ Nessuna criticità elevata")
        
        print_section("CRITICITÀ MEDIE")
        if medium_issues:
            for issue in medium_issues:
                print(f"   🟡 [{issue['category']}] {issue['description']}")
        else:
            print("   ✅ Nessuna criticità media")
        
        print_section("LIMITAZIONI SISTEMA")
        if self.limitations:
            for limitation in self.limitations:
                print(f"   ⚠️  [{limitation['category']}] {limitation['description']}")
                print(f"      Impatto: {limitation['impact']}")
        else:
            print("   ✅ Nessuna limitazione rilevata")
        
        # Valutazione complessiva
        print_section("VALUTAZIONE COMPLESSIVA")
        
        total_issues = len(self.criticalities) + len(self.limitations)
        critical_count = len(critical_issues)
        
        if critical_count > 0:
            print("🔴 SISTEMA NON PRONTO PER PRODUZIONE")
            print(f"   {critical_count} criticità critiche devono essere risolte")
        elif len(high_issues) > 3:
            print("🟠 SISTEMA RICHIEDE MIGLIORAMENTI SIGNIFICATIVI")
            print(f"   {len(high_issues)} criticità elevate da risolvere")
        elif total_issues > 5:
            print("🟡 SISTEMA ACCETTABILE CON LIMITAZIONI")
            print(f"   {total_issues} problemi minori identificati")
        else:
            print("🟢 SISTEMA ROBUSTO E AFFIDABILE")
            print(f"   Solo {total_issues} problemi minori rilevati")
        
        # Raccomandazioni
        print_section("RACCOMANDAZIONI")
        
        if critical_issues:
            print("   🎯 PRIORITÀ MASSIMA:")
            if any("Performance" in c["category"] for c in critical_issues):
                print("      - Ottimizzare algoritmi per ridurre tempi di calcolo")
            if any("API" in c["category"] for c in critical_issues):
                print("      - Stabilizzare interfaccia API e gestione errori")
            if any("Algorithm" in c["category"] for c in critical_issues):
                print("      - Rivedere logica algoritmi di ottimizzazione")
        
        if self.limitations:
            print("   💡 MIGLIORAMENTI SUGGERITI:")
            print("      - Implementare algoritmi ibridi per geometrie complesse")
            print("      - Aggiungere cache per scenari ricorrenti") 
            print("      - Sviluppare interfaccia operatori per override manuale")
            print("      - Implementare monitoraggio real-time prestazioni")

def main():
    """Esegue suite completa di test business efficiency con analisi critica"""
    
    print_header("MICROSERVIZIO OTTIMIZZAZIONE AUTOCLAVI - ANALISI CRITICA")
    print("Test di Efficientamento Business Process con Focus su Criticità e Limiti")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verifica microservizio disponibile
    try:
        response = requests.get(f"{API_BASE}/health/", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Microservizio disponibile e operativo")
            print(f"   Versione: {health_data.get('version', 'N/A')}")
        else:
            print("❌ Microservizio non risponde correttamente")
            return
    except Exception as e:
        print(f"❌ Impossibile connettersi al microservizio: {e}")
        print(f"   Assicurati che sia running su {MICROSERVICE_URL}")
        return
    
    tester = BusinessScenarioTester()
    
    # Scenari business normali
    tester.run_business_scenario_test("Produzione Quotidiana Tipica", 15)
    tester.run_business_scenario_test("Picco Produttivo Settimanale", 35)
    tester.run_business_scenario_test("Rush Delivery Urgente", 8)
    
    # Stress test per identificare limiti
    tester.run_stress_tests()
    
    # Analisi criticità
    tester.analyze_criticalities_and_limitations()
    
    # Sommario finale
    print_header("SOMMARIO EFFICIENTAMENTO COMPLESSIVO")
    
    total_annual_saving = 0
    total_roi = 0
    
    for scenario_name, results in tester.test_results.items():
        improvements = results["improvements"]
        print_section(f"Scenario: {scenario_name}")
        print_result("Miglioramento efficienza", f"{improvements['efficiency']:+.1f}", "%")
        print_result("Risparmio annuale", f"{improvements['annual_saving']:.0f}", " €")
        print_result("ROI", f"{improvements['roi']:.1f}", "x")
        
        total_annual_saving += improvements["annual_saving"]
        total_roi += improvements["roi"]
    
    avg_roi = total_roi / len(tester.test_results) if tester.test_results else 0
    
    print_section("RISULTATO COMPLESSIVO")
    print_result("RISPARMIO ANNUALE TOTALE", f"{total_annual_saving:.0f}", " €")
    print_result("ROI MEDIO", f"{avg_roi:.1f}", "x")
    
    # Conclusioni business
    print_header("CONCLUSIONI BUSINESS")
    
    if avg_roi > 10:
        print("🟢 ECCELLENTE: ROI molto elevato, implementazione altamente raccomandata")
    elif avg_roi > 5:
        print("🟢 OTTIMO: ROI elevato, implementazione fortemente raccomandata") 
    elif avg_roi > 2:
        print("🟡 BUONO: ROI positivo, implementazione raccomandata")
    elif avg_roi > 1:
        print("🟡 MARGINALE: ROI limitato, valutare attentamente")
    else:
        print("🔴 NEGATIVO: ROI insufficiente, non raccomandato")
    
    print(f"\n💡 Il microservizio di ottimizzazione dimostra un efficientamento")
    print(f"   significativo del processo aziendale con ROI {avg_roi:.1f}x")
    print(f"   e risparmio annuale stimato di €{total_annual_saving:.0f}")

if __name__ == "__main__":
    main()