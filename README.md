# Paiement Campay pour TIOZANG — Guide de mise en route

## 1. Tester en sandbox (gratuit, sans risque)
1. Crée un compte sur https://demo.campay.net
2. Connecte-toi → menu **Applications** → **Nouvelle application** → nomme-la "TIOZANG"
3. Ouvre l'application créée → section **APP KEYS** → copie le **token permanent**
4. Copie `.env.example` en `.env` et colle ton token dans `CAMPAY_PERMANENT_TOKEN`
5. Installe et lance le serveur :
   ```
   npm install
   npm start
   ```
6. Le serveur tourne sur http://localhost:3000 (utile pour tester avec un outil comme Postman)

## 2. Passer en production (vrai argent)
1. Crée cette fois un compte sur https://www.campay.net (vérification d'identité requise)
2. Refais les mêmes étapes (Applications → Nouvelle application → APP KEYS)
3. Dans `.env`, remplace :
   - `CAMPAY_BASE_URL` par `https://www.campay.net/api`
   - `CAMPAY_PERMANENT_TOKEN` par le nouveau token de production
4. Dans le tableau de bord Campay, configure l'URL du **webhook** vers :
   `https://TON-SERVEUR-EN-LIGNE/api/webhook/campay`
   (tu n'as cette adresse qu'une fois le serveur déployé en ligne — étape 3)

## 3. Mettre ce serveur en ligne (obligatoire pour que ça marche depuis le site)
Ce serveur doit être hébergé quelque part qui tourne 24h/24. Options simples et gratuites pour démarrer :
- **Render.com** (le plus simple : connecte ton dépôt GitHub, "New Web Service", il détecte `npm start`)
- **Railway.app**
- Dans les deux cas : ajoute tes variables `.env` dans leur interface "Environment Variables" — ne mets jamais le `.env` lui-même en ligne sur GitHub.

## 4. Brancher le site TIOZANG sur ce serveur
Dans le site, à l'étape "Confirmer ma commande", remplace l'affichage manuel du numéro par un appel à ton serveur :

```javascript
const reponse = await fetch('https://TON-SERVEUR-EN-LIGNE/api/payer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: grandTotal,      // montant total calculé par le site
    phone: customer.phone,   // numéro MTN/Orange du client, format 2376XXXXXXXX
    orderId: order.id,
  }),
});
const data = await reponse.json();
// data.reference -> à garder pour vérifier le statut plus tard
// Le client reçoit immédiatement un pop-up sur son téléphone pour entrer son code PIN
```

Une fois que tu as un serveur en ligne, dis-le-moi et je modifie directement le fichier du site
pour brancher ce flux automatique à la place du flux manuel actuel.

## Sécurité — règles à ne jamais casser
- Le `CAMPAY_PERMANENT_TOKEN` ne doit **jamais** apparaître dans le code du site (frontend) ni sur GitHub en clair.
- Toujours tester en sandbox avant de manipuler du vrai argent.
- Vérifie les noms exacts des champs dans ta documentation Campay au moment de l'intégration
  (l'API peut évoluer légèrement) : Applications > ta clé > "Documentation" dans ton tableau de bord.
