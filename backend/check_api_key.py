#!/usr/bin/env python3
"""Script de diagnostic pour vérifier la configuration de la clé API Anthropic"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Charger .env depuis le répertoire backend
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ Fichier .env trouvé : {env_path}")
else:
    load_dotenv()
    print("⚠️  Fichier .env non trouvé dans backend/, utilisation des variables d'environnement système")

api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    print("\n❌ ERREUR : ANTHROPIC_API_KEY n'est pas définie")
    print("\n📝 Solution :")
    print("1. Créez ou modifiez le fichier backend/.env")
    print("2. Ajoutez la ligne :")
    print("   ANTHROPIC_API_KEY=sk-ant-api03-VOTRE-CLE-ICI")
    print("3. Obtenez votre clé sur https://console.anthropic.com/")
    sys.exit(1)

api_key_clean = api_key.strip().strip('"').strip("'")

print(f"\n🔑 Clé API trouvée : {api_key_clean[:20]}...")

if not api_key_clean.startswith("sk-ant-"):
    print(f"\n❌ ERREUR : Format de clé invalide")
    print(f"   La clé doit commencer par 'sk-ant-', mais commence par '{api_key_clean[:10]}...'")
    print("\n📝 Solution :")
    print("   Obtenez une nouvelle clé valide sur https://console.anthropic.com/")
    sys.exit(1)

# Tester la clé
try:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key_clean)
    # Test simple
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=10,
        messages=[{"role": "user", "content": "Test"}]
    )
    print("\n✅ Clé API valide et fonctionnelle !")
    print(f"   Modèle testé : claude-3-5-sonnet-20241022")
    sys.exit(0)
except anthropic.AuthenticationError as e:
    print(f"\n❌ ERREUR : Clé API invalide ou expirée")
    print(f"   Détails : {str(e)}")
    print("\n📝 Solution :")
    print("   1. Vérifiez que la clé n'est pas expirée sur https://console.anthropic.com/")
    print("   2. Vérifiez que vous avez des crédits disponibles")
    print("   3. Obtenez une nouvelle clé si nécessaire")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ ERREUR : {str(e)}")
    sys.exit(1)

