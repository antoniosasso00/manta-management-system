import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from domain.entities import Tool, ODL, Autoclave, CycleGroup
from core.pre_filters.curing_cycle_filter import CuringCycleFilter
from core.pre_filters.elevated_support_filter import ElevatedSupportFilter
from core.optimization.multi_autoclave_optimizer import MultiAutoclaveOptimizer
from core.optimization.constraints import NestingConstraints
from core.optimization.nesting_engine import NestingEngine

class TestOptimizationAlgorithm:
    """Test suite per verificare l'efficienza e il funzionamento dell'algoritmo"""
    
    def setup_method(self):
        """Setup dati di test"""
        # Crea tool di test con dimensioni realistiche
        self.tools_small = [
            Tool(id=f"T{i}", width=300, height=400, weight=5)
            for i in range(1, 6)
        ]
        
        self.tools_medium = [
            Tool(id=f"T{i}", width=600, height=800, weight=15)
            for i in range(6, 11)
        ]
        
        self.tools_large = [
            Tool(id=f"T{i}", width=1000, height=1500, weight=30)
            for i in range(11, 16)
        ]
        
        # Crea ODL di test con cicli diversi
        self.odls_cycle_a = [
            ODL(
                id=f"ODL{i}",
                odl_number=f"ODL-2024-{i:04d}",
                part_number=f"PN-{i}",
                curing_cycle="CICLO_A",
                vacuum_lines=2,
                tools=[self.tools_small[i-1]]
            )
            for i in range(1, 6)
        ]
        
        self.odls_cycle_b = [
            ODL(
                id=f"ODL{i}",
                odl_number=f"ODL-2024-{i:04d}",
                part_number=f"PN-{i}",
                curing_cycle="CICLO_B",
                vacuum_lines=3,
                tools=[self.tools_medium[i-6]]
            )
            for i in range(6, 11)
        ]
        
        self.odls_mixed = [
            ODL(
                id=f"ODL{i}",
                odl_number=f"ODL-2024-{i:04d}",
                part_number=f"PN-{i}",
                curing_cycle="CICLO_C",
                vacuum_lines=1,
                tools=self.tools_large[i-11:i-10]
            )
            for i in range(11, 16)
        ]
        
        # Crea autoclavi di test
        self.autoclaves = [
            Autoclave(id="AC1", code="AC-001", width=1900, height=8000, vacuum_lines=20),
            Autoclave(id="AC2", code="AC-002", width=1500, height=6000, vacuum_lines=15),
            Autoclave(id="AC3", code="AC-003", width=1200, height=4000, vacuum_lines=10),
        ]
        
        # Constraints standard
        self.constraints = NestingConstraints(
            min_border_distance=50,
            min_tool_distance=30,
            allow_rotation=True
        )
    
    def test_curing_cycle_analysis(self):
        """Test analisi cicli di cura"""
        all_odls = self.odls_cycle_a + self.odls_cycle_b + self.odls_mixed
        
        groups, recommendations = CuringCycleFilter.analyze_cycles(all_odls)
        
        # Verifica raggruppamento corretto
        assert len(groups) == 3  # Tre cicli diversi
        
        # Verifica metriche
        for group in groups:
            assert group.odl_count == 5
            assert group.total_area > 0
            assert 0 <= group.optimization_score <= 1
        
        # Verifica che almeno un ciclo sia raccomandato
        assert len(recommendations) > 0
        
        print("\n=== Test Analisi Cicli di Cura ===")
        for group in groups:
            print(f"Ciclo {group.cycle_code}: {group.odl_count} ODL, "
                  f"Area {group.total_area/1000000:.2f} m², "
                  f"Score {group.optimization_score:.3f}")
    
    def test_elevated_support_analysis(self):
        """Test analisi supporti rialzati"""
        all_odls = self.odls_cycle_a + self.odls_cycle_b + self.odls_mixed
        
        elevated_by_odl, space_saved = ElevatedSupportFilter.analyze_elevated_candidates(all_odls)
        
        # Verifica che tool grandi siano selezionati per elevazione
        total_elevated = sum(len(tools) for tools in elevated_by_odl.values())
        assert total_elevated > 0
        assert space_saved > 0
        
        # Verifica che i tool più grandi abbiano priorità
        recommendations = ElevatedSupportFilter.get_tool_recommendations(all_odls, elevated_by_odl)
        
        elevated_tools = [r for r in recommendations if r['recommendation'] == 'ELEVATE']
        if elevated_tools:
            avg_elevated_area = sum(t['area'] for t in elevated_tools) / len(elevated_tools)
            ground_tools = [r for r in recommendations if r['recommendation'] == 'GROUND']
            if ground_tools:
                avg_ground_area = sum(t['area'] for t in ground_tools) / len(ground_tools)
                assert avg_elevated_area > avg_ground_area
        
        print("\n=== Test Supporti Rialzati ===")
        print(f"Tool elevati: {total_elevated}/{len(recommendations)}")
        print(f"Spazio risparmiato: {space_saved:.1f}%")
    
    def test_single_autoclave_optimization(self):
        """Test ottimizzazione singolo autoclave"""
        engine = NestingEngine(self.constraints)
        
        # Test con ODL piccoli - dovrebbero entrare tutti
        result = engine.optimize_single_autoclave(
            self.odls_cycle_a,
            self.autoclaves[0]  # Autoclave grande
        )
        
        assert result is not None
        assert len(result.placements) == len(self.odls_cycle_a)
        assert result.efficiency > 0
        assert result.efficiency < 1  # Non può essere 100% per via dei margini
        
        print("\n=== Test Singolo Autoclave ===")
        print(f"ODL posizionati: {len(result.placements)}/{len(self.odls_cycle_a)}")
        print(f"Efficienza: {result.efficiency * 100:.1f}%")
        print(f"Peso totale: {result.total_weight} kg")
        print(f"Linee vuoto: {result.vacuum_lines_used}/{self.autoclaves[0].vacuum_lines}")
        
        # Verifica non-sovrapposizione
        for i, p1 in enumerate(result.placements):
            for j, p2 in enumerate(result.placements[i+1:], i+1):
                assert not self._rectangles_overlap(
                    (p1.x, p1.y, p1.x + p1.width, p1.y + p1.height),
                    (p2.x, p2.y, p2.x + p2.width, p2.y + p2.height)
                )
    
    def test_multi_autoclave_optimization(self):
        """Test ottimizzazione multi-autoclave"""
        optimizer = MultiAutoclaveOptimizer(self.constraints)
        
        # Mix di ODL con stesso ciclo
        test_odls = self.odls_cycle_a + self.odls_cycle_a  # Duplica per più ODL
        
        batches, metrics = optimizer.optimize(
            test_odls,
            self.autoclaves,
            {}
        )
        
        assert len(batches) > 0
        assert metrics['total_odls_placed'] > 0
        assert metrics['success_rate'] > 0
        
        # Verifica distribuzione efficiente
        total_area_used = sum(b.efficiency * a.area 
                            for b, a in zip(batches, 
                                          [next(a for a in self.autoclaves if a.id == b.autoclave_id) 
                                           for b in batches]))
        total_area_available = sum(a.area for a in self.autoclaves[:len(batches)])
        global_efficiency = total_area_used / total_area_available if total_area_available > 0 else 0
        
        print("\n=== Test Multi-Autoclave ===")
        print(f"Batch creati: {len(batches)}")
        print(f"ODL posizionati: {metrics['total_odls_placed']}/{metrics['total_odls_input']}")
        print(f"Success rate: {metrics['success_rate'] * 100:.1f}%")
        print(f"Tempo esecuzione: {metrics['execution_time']:.2f}s")
        print(f"Efficienza globale: {global_efficiency * 100:.1f}%")
        
        for batch in batches:
            autoclave = next(a for a in self.autoclaves if a.id == batch.autoclave_id)
            print(f"\nAutoclave {autoclave.code}: {len(batch.placements)} ODL, "
                  f"Efficienza {batch.efficiency * 100:.1f}%")
    
    def test_constraints_validation(self):
        """Test rispetto dei vincoli"""
        engine = NestingEngine(self.constraints)
        
        # Test con vincoli stretti
        tight_constraints = NestingConstraints(
            min_border_distance=100,
            min_tool_distance=50,
            allow_rotation=False
        )
        engine_tight = NestingEngine(tight_constraints)
        
        result_normal = engine.optimize_single_autoclave(
            self.odls_cycle_b[:3],
            self.autoclaves[2]  # Autoclave piccola
        )
        
        result_tight = engine_tight.optimize_single_autoclave(
            self.odls_cycle_b[:3],
            self.autoclaves[2]
        )
        
        # Con vincoli più stretti, l'efficienza dovrebbe essere minore
        if result_normal and result_tight:
            assert result_tight.efficiency <= result_normal.efficiency
        
        print("\n=== Test Vincoli ===")
        print(f"Efficienza vincoli normali: {result_normal.efficiency * 100:.1f}%" if result_normal else "N/A")
        print(f"Efficienza vincoli stretti: {result_tight.efficiency * 100:.1f}%" if result_tight else "N/A")
    
    def test_edge_cases(self):
        """Test casi limite"""
        optimizer = MultiAutoclaveOptimizer(self.constraints)
        
        # Test con ODL vuoti
        batches, metrics = optimizer.optimize([], self.autoclaves, {})
        assert len(batches) == 0
        assert metrics['total_odls_placed'] == 0
        
        # Test con un solo ODL molto grande
        huge_tool = Tool(id="HUGE", width=1800, height=7900, weight=100)
        huge_odl = ODL(
            id="ODL_HUGE",
            odl_number="ODL-HUGE",
            part_number="PN-HUGE",
            curing_cycle="CICLO_X",
            vacuum_lines=5,
            tools=[huge_tool]
        )
        
        batches, metrics = optimizer.optimize([huge_odl], self.autoclaves, {})
        assert metrics['total_odls_placed'] <= 1
        
        print("\n=== Test Casi Limite ===")
        print("✓ ODL vuoti gestito correttamente")
        print(f"✓ ODL enorme: {metrics['total_odls_placed']} posizionati")
    
    def test_performance(self):
        """Test performance con molti ODL"""
        import time
        
        # Genera molti ODL piccoli
        many_odls = []
        for i in range(50):
            tool = Tool(id=f"T{i}", width=200+i*10, height=300+i*10, weight=5)
            odl = ODL(
                id=f"ODL{i}",
                odl_number=f"ODL-PERF-{i:04d}",
                part_number=f"PN-PERF-{i}",
                curing_cycle="CICLO_PERF",
                vacuum_lines=1,
                tools=[tool]
            )
            many_odls.append(odl)
        
        optimizer = MultiAutoclaveOptimizer(self.constraints)
        
        start_time = time.time()
        batches, metrics = optimizer.optimize(many_odls, self.autoclaves, {})
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        # Dovrebbe completare in tempo ragionevole
        assert execution_time < 30  # Max 30 secondi per 50 ODL
        assert metrics['total_odls_placed'] > 0
        
        print("\n=== Test Performance ===")
        print(f"ODL processati: {len(many_odls)}")
        print(f"Tempo esecuzione: {execution_time:.2f}s")
        print(f"ODL/secondo: {len(many_odls)/execution_time:.1f}")
        print(f"ODL posizionati: {metrics['total_odls_placed']}")
    
    def _rectangles_overlap(self, rect1, rect2):
        """Verifica sovrapposizione rettangoli"""
        x1, y1, x2, y2 = rect1
        x3, y3, x4, y4 = rect2
        return not (x2 <= x3 or x4 <= x1 or y2 <= y3 or y4 <= y1)


if __name__ == "__main__":
    # Esegui test
    test = TestOptimizationAlgorithm()
    test.setup_method()
    
    print("=== ESECUZIONE TEST ALGORITMO OTTIMIZZAZIONE ===\n")
    
    test.test_curing_cycle_analysis()
    test.test_elevated_support_analysis()
    test.test_single_autoclave_optimization()
    test.test_multi_autoclave_optimization()
    test.test_constraints_validation()
    test.test_edge_cases()
    test.test_performance()
    
    print("\n✅ TUTTI I TEST COMPLETATI CON SUCCESSO!")