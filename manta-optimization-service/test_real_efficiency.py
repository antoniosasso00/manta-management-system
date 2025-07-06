#!/usr/bin/env python3
"""
Test di Efficienza Business REALE per Microservizio Ottimizzazione Autoclavi
==========================================================================

Test basato sui REQUISITI REALI del sistema:
- Solo forme rettangolari (nessuna forma irregolare)
- Nessun calcolo di costi energetici (non previsti nel dominio)
- Integrazione diretta senza AI complesse
- Focus su efficienza spaziale e throughput produzione
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

class RealBusinessTester:
    def __init__(self):
        self.test_results = {}
        self.issues = []
        
    def add_issue(self, category: str, description: str, severity: str):
        """Registra un problema rilevato"""
        self.issues.append({
            "category": category,
            "description": description,
            "severity": severity,  # LOW, MEDIUM, HIGH, CRITICAL
            "timestamp": datetime.now()
        })
        
    def generate_realistic_aerospace_odls(self, count: int) -> List[Dict]:
        """Genera ODL realistici per produzione aerospaziale - SOLO RETTANGOLI"""
        
        # Parti aerospaziali reali (tutte rettangolari come da requisiti)
        typical_aerospace_parts = [
            # Pannelli fusoliera
            {"width": 2400, "height": 1200, "type": "Panel_Fuselage"},
            {"width": 1800, "height": 800, "type": "Panel_Wing"},
            {"width": 1600, "height": 900, "type": "Panel_Door"},
            
            # Componenti strutturali
            {"width": 1200, "height": 600, "type": "Structural_Frame"},
            {"width": 800, "height": 400, "type": "Support_Bracket"},
            {"width": 600, "height": 300, "type": "Small_Component"},
            
            # Parti grandi
            {"width": 3000, "height": 1500, "type": "Large_Panel"},
            {"width": 1000, "height": 500, "type": "Medium_Component"},
        ]
        
        # Cicli di cura realistici per compositi aerospaziali
        curing_cycles = [
            "CICLO_STANDARD_180C",   # Ciclo più comune
            "CICLO_PESANTE_200C",    # Parti spesse
            "CICLO_RAPIDO_160C",     # Parti urgenti
            "CICLO_LUNGO_170C",      # Parti complesse
        ]
        
        odls = []
        for i in range(count):
            part = random.choice(typical_aerospace_parts)
            
            # Variabilità minima (toleranze produttive reali)
            width = part["width"] + random.randint(-50, 50)
            height = part["height"] + random.randint(-25, 25)
            
            # Numero tools per ODL (aerospazio tipicamente 1-2)
            num_tools = random.choices([1, 2], weights=[70, 30])[0]
            
            tools = []
            for j in range(num_tools):
                tool = {
                    "id": f"T{i+1}_{j+1}",
                    "width": width,   
                    "height": height, 
                    "weight": (width * height * 5) / 1000000,  # ~5mm spessore tipico compositi
                }
                tools.append(tool)
            
            odl = {
                "id": f"ODL-2024-{i+1:03d}",
                "odl_number": f"ODL-2024-{i+1:03d}",
                "part_number": f"PN-{part['type']}-{i+1:03d}",
                "curing_cycle": random.choice(curing_cycles),
                "vacuum_lines": random.randint(1, 3),  # Realistico per aerospazio
                "tools": tools,
                "total_area": sum(t["width"] * t["height"] for t in tools) / 1000000,  # m²
                # Priorità basata su delivery schedule reale
                "priority": random.choices(["NORMAL", "HIGH", "URGENT"], 
                                         weights=[60, 30, 10])[0],
                "due_date": (datetime.now() + timedelta(days=random.randint(7, 60))).isoformat(),
            }
            odls.append(odl)
            
        return odls
    
    def generate_realistic_autoclaves(self) -> List[Dict]:
        """Genera configurazione autoclavi reale del cliente"""
        return [
            {
                "id": "AC-001",
                "code": "AUTOCLAVE-LINEA-A",
                "width": 4000,    # 4m x 2.5m (autoclave grande)
                "height": 2500,   
                "vacuum_lines": 6,
                "max_weight": 5000,  # kg
                # Dati operativi reali (senza costi non previsti)
                "efficiency_rating": 0.95,
                "utilization_target": 0.80,  # Target 80% riempimento
            },
            {
                "id": "AC-002", 
                "code": "AUTOCLAVE-LINEA-B",
                "width": 3000,    # 3m x 2m (autoclave media)
                "height": 2000,   
                "vacuum_lines": 4,
                "max_weight": 3000,
                "efficiency_rating": 0.88,
                "utilization_target": 0.75,
            },
            {
                "id": "AC-003",
                "code": "AUTOCLAVE-LINEA-C",
                "width": 2000,    # 2m x 1.5m (autoclave piccola)
                "height": 1500,   
                "vacuum_lines": 2,
                "max_weight": 2000,
                "efficiency_rating": 0.82,
                "utilization_target": 0.70,
            }
        ]
    
    def calculate_manual_planning(self, odls: List[Dict], autoclaves: List[Dict]) -> Dict:
        """Simula pianificazione manuale attuale (approccio current state)"""
        
        # Pianificazione manuale: raggruppamento semplice per ciclo
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
        
        batches = []
        
        for cycle, cycle_odls in cycle_groups.items():
            # Ordina per priorità (manual approach)
            priority_order = {"URGENT": 3, "HIGH": 2, "NORMAL": 1}
            cycle_odls.sort(key=lambda x: priority_order[x["priority"]], reverse=True)
            
            # Riempi autoclavi in ordine di dimensione
            autoclaves_sorted = sorted(autoclaves, key=lambda x: x["width"] * x["height"], reverse=True)
            
            remaining_odls = cycle_odls.copy()
            
            for autoclave in autoclaves_sorted:
                if not remaining_odls:
                    break
                    
                autoclave_area = (autoclave["width"] * autoclave["height"]) / 1000000  # m²
                target_usage = autoclave["utilization_target"]
                max_area = autoclave_area * target_usage
                
                batch_area = 0
                batch_odls = []
                
                # Riempimento greedy manuale (inefficiente)
                i = 0
                while i < len(remaining_odls) and batch_area < max_area:
                    odl = remaining_odls[i]
                    odl_area = odl["total_area"]
                    
                    if batch_area + odl_area <= max_area:
                        batch_odls.append(odl)
                        batch_area += odl_area
                        remaining_odls.pop(i)
                    else:
                        i += 1
                
                if batch_odls:
                    efficiency = (batch_area / autoclave_area) * 100
                    # Tempo cura tipico per compositi aerospaziali
                    cure_time = random.randint(240, 480)  # 4-8 ore
                    
                    total_batches += 1
                    total_area_used += batch_area
                    total_area_available += autoclave_area
                    processing_time_hours += cure_time / 60
                    
                    batches.append({
                        "autoclave": autoclave["code"],
                        "cycle": cycle,
                        "odls_count": len(batch_odls),
                        "efficiency": efficiency,
                        "area_used": batch_area,
                        "cure_time_minutes": cure_time,
                    })
            
            # ODL non processati
            unprocessed_odls += len(remaining_odls)
        
        overall_efficiency = (total_area_used / total_area_available) * 100 if total_area_available > 0 else 0
        
        return {
            "method": "Pianificazione Manuale",
            "total_batches": total_batches,
            "overall_efficiency": overall_efficiency,
            "total_processing_hours": processing_time_hours,
            "unprocessed_odls": unprocessed_odls,
            "batches": batches,
            "total_area_used": total_area_used,
            "total_area_available": total_area_available,
        }
    
    def test_microservice_optimization(self, odls: List[Dict], autoclaves: List[Dict]) -> Dict:
        """Testa ottimizzazione microservizio con validazione real-time"""
        
        all_cycles = list(set(odl["curing_cycle"] for odl in odls))
        
        payload = {
            "odls": odls,
            "autoclaves": autoclaves, 
            "selected_cycles": all_cycles,
            "elevated_tools": [],  # Nessun supporto rialzato per semplicità
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
                timeout=30  # Timeout più realistico
            )
            optimization_time = time.time() - start_time
            
            # Validazione tempi di risposta
            if optimization_time > 10:
                self.add_issue("Performance", 
                             f"Tempo ottimizzazione lento: {optimization_time:.1f}s per {len(odls)} ODL", 
                             "MEDIUM")
            
            if response.status_code != 200:
                self.add_issue("API", f"Errore API: {response.status_code}", "HIGH")
                return {"error": f"API error: {response.status_code}"}
                
            result = response.json()
            
            # Validazione risultati
            batches = result.get("batches", [])
            if not batches:
                self.add_issue("Algorithm", "Nessun batch generato", "HIGH")
                return {"error": "No batches generated"}
            
            # Calcola metriche reali
            total_batches = len(batches)
            total_area_used = 0
            total_area_available = 0
            total_processing_hours = 0
            low_efficiency_count = 0
            
            for batch in batches:
                area_efficiency = batch.get("metrics", {}).get("area_efficiency", 0) * 100
                autoclave_area = None
                
                # Trova area autoclave
                for autoclave in autoclaves:
                    if autoclave["id"] == batch["autoclave_id"]:
                        autoclave_area = (autoclave["width"] * autoclave["height"]) / 1000000
                        break
                
                if autoclave_area:
                    used_area = autoclave_area * (area_efficiency / 100)
                    total_area_used += used_area
                    total_area_available += autoclave_area
                    
                    if area_efficiency < 50:  # Soglia efficienza bassa
                        low_efficiency_count += 1
                        self.add_issue("Efficiency", 
                                     f"Batch {batch['batch_id'][:8]} efficienza bassa: {area_efficiency:.1f}%", 
                                     "MEDIUM")
                
                # Tempo processamento stimato
                total_processing_hours += random.randint(240, 480) / 60  # 4-8 ore tipiche
            
            processed_odls = result.get("total_odls_placed", 0)
            unprocessed_odls = len(odls) - processed_odls
            overall_efficiency = (total_area_used / total_area_available) * 100 if total_area_available > 0 else 0
            
            # Validazioni finali
            if unprocessed_odls > len(odls) * 0.15:  # Più del 15% non processato
                self.add_issue("Coverage", 
                             f"{unprocessed_odls} ODL non processati ({(unprocessed_odls/len(odls)*100):.1f}%)", 
                             "MEDIUM")
            
            if overall_efficiency < 60:  # Efficienza generale bassa
                self.add_issue("Overall Performance", 
                             f"Efficienza generale bassa: {overall_efficiency:.1f}%", 
                             "MEDIUM")
            
            return {
                "method": "Ottimizzazione Microservizio",
                "total_batches": total_batches,
                "overall_efficiency": overall_efficiency,
                "total_processing_hours": total_processing_hours,
                "unprocessed_odls": unprocessed_odls,
                "optimization_time": optimization_time,
                "low_efficiency_batches": low_efficiency_count,
                "success_rate": result.get("success_rate", 0),
                "total_area_used": total_area_used,
                "total_area_available": total_area_available,
                "raw_result": result
            }
            
        except requests.exceptions.Timeout:
            self.add_issue("Performance", "Timeout ottimizzazione (>30s)", "HIGH") 
            return {"error": "Optimization timeout"}
        except requests.exceptions.RequestException as e:
            self.add_issue("Infrastructure", f"Connessione fallita: {e}", "HIGH")
            return {"error": f"Connection failed: {e}"}
        except Exception as e:
            self.add_issue("System", f"Errore generale: {e}", "HIGH")
            return {"error": f"General error: {e}"}
    
    def run_real_business_scenario(self, scenario_name: str, odl_count: int):
        """Esegue test business scenario realistico"""
        
        print_header(f"SCENARIO: {scenario_name}")
        print(f"📋 ODL da processare: {odl_count}")
        
        # Genera dati realistici
        print_section("Generazione Dati Aerospaziali")
        odls = self.generate_realistic_aerospace_odls(odl_count)
        autoclaves = self.generate_realistic_autoclaves()
        
        print_result("ODL generati", len(odls))
        print_result("Autoclavi disponibili", len(autoclaves))
        print_result("Area totale ODL", sum(odl["total_area"] for odl in odls), " m²")
        print_result("Area totale autoclavi", sum(a["width"]*a["height"] for a in autoclaves)/1000000, " m²")
        
        # Test pianificazione manuale
        print_section("Pianificazione Manuale (Current State)")
        manual_result = self.calculate_manual_planning(odls, autoclaves)
        
        print_result("Batch creati", manual_result["total_batches"])
        print_result("Efficienza media spaziale", f"{manual_result['overall_efficiency']:.1f}", "%")
        print_result("Tempo processamento", f"{manual_result['total_processing_hours']:.1f}", " ore")
        print_result("ODL non processati", manual_result["unprocessed_odls"])
        
        # Test ottimizzazione microservizio
        print_section("Ottimizzazione Microservizio (Future State)")
        ai_result = self.test_microservice_optimization(odls, autoclaves)
        
        if "error" in ai_result:
            print(f"❌ Errore ottimizzazione: {ai_result['error']}")
            return
            
        print_result("Batch creati", ai_result["total_batches"])
        print_result("Efficienza media spaziale", f"{ai_result['overall_efficiency']:.1f}", "%") 
        print_result("Tempo processamento", f"{ai_result['total_processing_hours']:.1f}", " ore")
        print_result("ODL non processati", ai_result["unprocessed_odls"])
        print_result("Tempo ottimizzazione", f"{ai_result['optimization_time']:.2f}", " secondi")
        print_result("Tasso successo", f"{ai_result['success_rate']:.1%}")
        
        # Analisi miglioramenti business
        print_section("Analisi Miglioramento Business")
        
        print_improvement(
            manual_result["overall_efficiency"], 
            ai_result["overall_efficiency"],
            "Efficienza Spaziale"
        )
        
        batch_improvement = manual_result["total_batches"] - ai_result["total_batches"]
        if batch_improvement != 0:
            print_result("Variazione batch", batch_improvement, 
                        f" ({(batch_improvement/manual_result['total_batches']*100):+.1f}%)")
        
        time_improvement = manual_result["total_processing_hours"] - ai_result["total_processing_hours"]
        if time_improvement != 0:
            print_result("Variazione tempo", f"{time_improvement:+.1f}", " ore")
        
        unprocessed_improvement = manual_result["unprocessed_odls"] - ai_result["unprocessed_odls"]
        if unprocessed_improvement > 0:
            print_result("ODL aggiuntivi processati", unprocessed_improvement)
        
        # Calcola throughput improvement (ODL/ora)
        manual_throughput = (len(odls) - manual_result["unprocessed_odls"]) / manual_result["total_processing_hours"] if manual_result["total_processing_hours"] > 0 else 0
        ai_throughput = (len(odls) - ai_result["unprocessed_odls"]) / ai_result["total_processing_hours"] if ai_result["total_processing_hours"] > 0 else 0
        
        print_improvement(manual_throughput, ai_throughput, "Throughput (ODL/ora)")
        
        # Salva risultati
        self.test_results[scenario_name] = {
            "manual": manual_result,
            "microservice": ai_result,
            "improvements": {
                "efficiency": ai_result["overall_efficiency"] - manual_result["overall_efficiency"],
                "throughput": ai_throughput - manual_throughput,
                "unprocessed_reduction": unprocessed_improvement,
            }
        }
        
    def analyze_issues(self):
        """Analizza e riporta problemi rilevati"""
        
        print_header("ANALISI PROBLEMI E LIMITAZIONI")
        
        if not self.issues:
            print("🟢 Nessun problema rilevato nel test")
            return
        
        # Raggruppa per severità
        critical = [i for i in self.issues if i["severity"] == "CRITICAL"]
        high = [i for i in self.issues if i["severity"] == "HIGH"] 
        medium = [i for i in self.issues if i["severity"] == "MEDIUM"]
        low = [i for i in self.issues if i["severity"] == "LOW"]
        
        print_section("PROBLEMI CRITICI")
        if critical:
            for issue in critical:
                print(f"   🔴 [{issue['category']}] {issue['description']}")
        else:
            print("   ✅ Nessun problema critico")
        
        print_section("PROBLEMI ELEVATI")
        if high:
            for issue in high:
                print(f"   🟠 [{issue['category']}] {issue['description']}")
        else:
            print("   ✅ Nessun problema elevato")
        
        print_section("PROBLEMI MEDI")
        if medium:
            for issue in medium:
                print(f"   🟡 [{issue['category']}] {issue['description']}")
        else:
            print("   ✅ Nessun problema medio")
        
        # Valutazione
        print_section("VALUTAZIONE SISTEMA")
        
        total_issues = len(self.issues)
        critical_count = len(critical)
        high_count = len(high)
        
        if critical_count > 0:
            print("🔴 SISTEMA NON PRONTO - Problemi critici")
        elif high_count > 2:
            print("🟠 SISTEMA RICHIEDE MIGLIORAMENTI")
        elif total_issues > 3:
            print("🟡 SISTEMA ACCETTABILE CON LIMITAZIONI")
        else:
            print("🟢 SISTEMA FUNZIONANTE E AFFIDABILE")

def main():
    """Esegue test efficienza business reale"""
    
    print_header("TEST EFFICIENZA BUSINESS MICROSERVIZIO AUTOCLAVI")
    print("Focus: Requisiti Reali - Rettangoli, Efficienza Spaziale, Throughput")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verifica disponibilità microservizio
    try:
        response = requests.get(f"{API_BASE}/health/", timeout=5)
        if response.status_code == 200:
            print("✅ Microservizio operativo e pronto")
        else:
            print("❌ Microservizio non disponibile")
            return
    except Exception as e:
        print(f"❌ Connessione fallita: {e}")
        return
    
    tester = RealBusinessTester()
    
    # Scenari business realistici
    tester.run_real_business_scenario("Produzione Giornaliera Standard", 12)
    tester.run_real_business_scenario("Picco Settimanale", 25)
    tester.run_real_business_scenario("Rush Order Urgente", 6)
    
    # Analisi problemi
    tester.analyze_issues()
    
    # Sommario finale
    print_header("SOMMARIO EFFICIENTAMENTO")
    
    total_efficiency_gain = 0
    total_throughput_gain = 0
    scenario_count = 0
    
    for scenario_name, results in tester.test_results.items():
        improvements = results["improvements"]
        print_section(f"Scenario: {scenario_name}")
        print_result("Miglioramento efficienza", f"{improvements['efficiency']:+.1f}", "%")
        print_result("Miglioramento throughput", f"{improvements['throughput']:+.2f}", " ODL/ora")
        
        total_efficiency_gain += improvements["efficiency"]
        total_throughput_gain += improvements["throughput"]
        scenario_count += 1
    
    if scenario_count > 0:
        avg_efficiency_gain = total_efficiency_gain / scenario_count
        avg_throughput_gain = total_throughput_gain / scenario_count
        
        print_section("RISULTATO COMPLESSIVO")
        print_result("MIGLIORAMENTO EFFICIENZA MEDIO", f"{avg_efficiency_gain:+.1f}", "%")
        print_result("MIGLIORAMENTO THROUGHPUT MEDIO", f"{avg_throughput_gain:+.2f}", " ODL/ora")
        
        # Valutazione business finale
        print_header("CONCLUSIONI BUSINESS")
        
        if avg_efficiency_gain > 20:
            print("🟢 ECCELLENTE: Miglioramento significativo, implementazione fortemente raccomandata")
        elif avg_efficiency_gain > 10:
            print("🟢 BUONO: Miglioramento apprezzabile, implementazione raccomandata") 
        elif avg_efficiency_gain > 5:
            print("🟡 MODERATO: Miglioramento presente ma limitato")
        elif avg_efficiency_gain > 0:
            print("🟡 MARGINALE: Miglioramento minimo")
        else:
            print("🔴 NEGATIVO: Nessun miglioramento rilevato")
        
        print(f"\n💡 Il microservizio dimostra un miglioramento medio")
        print(f"   dell'efficienza spaziale del {avg_efficiency_gain:+.1f}%")
        print(f"   e del throughput di {avg_throughput_gain:+.2f} ODL/ora")

if __name__ == "__main__":
    main()