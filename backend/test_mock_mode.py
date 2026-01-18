#!/usr/bin/env python3
"""
Script de test pour vérifier le mode mock
"""
import os
import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from ava.services.conversational_ai import ConversationalAI

def test_mock_mode():
    """Test le mode mock"""
    print("=" * 60)
    print("Test du mode mock ConversationalAI")
    print("=" * 60)
    print()
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    print(f"ANTHROPIC_API_KEY configurée : {api_key is not None}")
    if api_key:
        print(f"Format clé : {api_key[:20]}... (commence par 'sk-ant-': {api_key.startswith('sk-ant-')})")
    print()
    
    try:
        ai_service = ConversationalAI()
        print(f"[OK] Service initialise avec succes")
        print(f"   Mode mock : {ai_service.use_mock}")
        print()
        
        # Test d'une analyse
        print("Test d'analyse initiale...")
        result = ai_service.analyze_initial_description(
            "Le client envoie un email. On verifie le stock. On fait un devis.",
            "transformation"
        )
        print(f"[OK] Analyse reussie")
        print(f"   Activites detectees : {len(result.get('activities', []))}")
        for act in result.get('activities', [])[:3]:
            print(f"   - {act.get('label', 'N/A')}")
        print()
        
        if ai_service.use_mock:
            print("[WARNING] MODE DEVELOPPEMENT ACTIF")
            print("   L'application utilise des reponses mockees.")
            print("   Pour utiliser l'API reelle, configurez ANTHROPIC_API_KEY dans backend/.env")
            print("   Executez : .\\setup-api-key.ps1")
        else:
            print("[OK] MODE PRODUCTION ACTIF")
            print("   L'application utilise l'API Anthropic reelle.")
        
    except Exception as e:
        print(f"[ERROR] Erreur : {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = test_mock_mode()
    sys.exit(0 if success else 1)

