#!/usr/bin/env python3
"""
Script de configuration de la clé API Anthropic
"""
import os
from pathlib import Path

def setup_api_key():
    """Configure la clé API Anthropic dans le fichier .env"""
    env_file = Path(__file__).parent / ".env"
    
    print("=" * 60)
    print("Configuration de la clé API Anthropic")
    print("=" * 60)
    print()
    print("Pour obtenir votre clé API :")
    print("1. Allez sur https://console.anthropic.com/")
    print("2. Connectez-vous ou créez un compte")
    print("3. Allez dans 'API Keys'")
    print("4. Créez une nouvelle clé ou copiez une clé existante")
    print()
    print("La clé doit commencer par 'sk-ant-'")
    print()
    
    # Vérifier si une clé existe déjà
    existing_key = None
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('ANTHROPIC_API_KEY='):
                    existing_key = line.split('=', 1)[1].strip()
                    if existing_key and existing_key != 'sk-ant-api03-...' and existing_key.startswith('sk-ant-'):
                        print(f"⚠️  Une clé existe déjà : {existing_key[:20]}...")
                        response = input("Voulez-vous la remplacer ? (o/N) : ").strip().lower()
                        if response != 'o':
                            print("✅ Configuration annulée. La clé existante est conservée.")
                            return
                    break
    
    # Demander la nouvelle clé
    print()
    api_key = input("Collez votre clé API Anthropic ici : ").strip()
    
    if not api_key:
        print("❌ Aucune clé fournie. Configuration annulée.")
        return
    
    # Nettoyer la clé
    api_key = api_key.strip().strip('"').strip("'")
    
    # Valider le format
    if not api_key.startswith("sk-ant-"):
        print(f"❌ Format invalide. La clé doit commencer par 'sk-ant-'")
        print(f"   Clé fournie : {api_key[:20]}...")
        return
    
    # Lire le contenu existant du fichier .env
    env_content = []
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            env_content = f.readlines()
    
    # Mettre à jour ou ajouter ANTHROPIC_API_KEY
    updated = False
    new_content = []
    for line in env_content:
        if line.startswith('ANTHROPIC_API_KEY='):
            new_content.append(f'ANTHROPIC_API_KEY={api_key}\n')
            updated = True
        else:
            new_content.append(line)
    
    if not updated:
        # Ajouter la clé à la fin
        if new_content and not new_content[-1].endswith('\n'):
            new_content.append('\n')
        new_content.append(f'ANTHROPIC_API_KEY={api_key}\n')
    
    # Écrire le fichier
    env_file.parent.mkdir(parents=True, exist_ok=True)
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(new_content)
    
    print()
    print("✅ Clé API configurée avec succès !")
    print(f"   Fichier : {env_file}")
    print(f"   Clé : {api_key[:20]}...{api_key[-10:]}")
    print()
    print("⚠️  Redémarrez le serveur backend pour que les changements prennent effet :")
    print("   uvicorn ava.main:app --reload --port 8000")
    print()

if __name__ == "__main__":
    try:
        setup_api_key()
    except KeyboardInterrupt:
        print("\n\n❌ Configuration annulée par l'utilisateur.")
    except Exception as e:
        print(f"\n❌ Erreur : {e}")

