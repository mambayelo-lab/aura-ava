# Configuration de la clé API Anthropic

## Méthode 1 : Script PowerShell (Recommandé)

Exécutez simplement :

```powershell
cd backend
.\setup-api-key.ps1
```

Le script vous guidera pour :
1. Obtenir votre clé API sur https://console.anthropic.com/
2. La coller dans le terminal
3. La sauvegarder automatiquement dans `.env`

## Méthode 2 : Configuration manuelle

1. **Obtenez votre clé API** :
   - Allez sur https://console.anthropic.com/
   - Connectez-vous ou créez un compte
   - Allez dans "API Keys"
   - Créez une nouvelle clé ou copiez une clé existante

2. **Modifiez le fichier `backend/.env`** :
   ```env
   # Configuration AURA AVA V3
   
   # Anthropic Claude API (pour interview conversationnelle)
   # Obtenez votre clé sur https://console.anthropic.com/
   ANTHROPIC_API_KEY=votre-cle-api-ici
   ```
   
   **Important** :
   - Remplacez `votre-cle-api-ici` par votre vraie clé
   - La clé doit commencer par `sk-ant-`
   - Pas de guillemets, pas d'espaces
   - Pas de ligne vide après la clé

3. **Redémarrez le serveur backend** :
   ```bash
   cd backend
   uvicorn ava.main:app --reload --port 8000
   ```

## Vérification

Pour vérifier que la clé est bien configurée :

```bash
cd backend
python check_api_key.py
```

Ou testez l'endpoint de diagnostic :

```bash
curl http://localhost:8000/api/conversational-interview/check-api-key
```

## Dépannage

### Erreur "invalid x-api-key"
- Vérifiez que votre clé commence bien par `sk-ant-`
- Vérifiez qu'il n'y a pas d'espaces ou de guillemets autour de la clé
- Vérifiez que la clé n'est pas expirée sur https://console.anthropic.com/

### Erreur "ANTHROPIC_API_KEY environment variable not set"
- Vérifiez que le fichier `.env` existe dans le dossier `backend/`
- Vérifiez que le fichier contient bien `ANTHROPIC_API_KEY=...`
- Redémarrez le serveur après avoir modifié `.env`

### Le serveur ne charge pas la clé
- Assurez-vous que `load_dotenv()` est appelé dans `main.py` (c'est déjà le cas)
- Vérifiez que vous êtes dans le bon répertoire lors du démarrage du serveur
- Redémarrez complètement le serveur (arrêtez avec Ctrl+C puis relancez)

