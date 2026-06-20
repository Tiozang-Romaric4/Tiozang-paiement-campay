
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// CORS basique pour autoriser ton site à appeler ce serveur.
// Remplace '*' par l'adresse exacte de ton site une fois en ligne, pour plus de sécurité.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api';
const CAMPAY_PERMANENT_TOKEN = process.env.CAMPAY_PERMANENT_TOKEN;

if (!CAMPAY_PERMANENT_TOKEN) {
  console.warn('⚠️  CAMPAY_PERMANENT_TOKEN manquant dans le fichier .env — les paiements échoueront.');
}

/**
 * 1) Démarrer une demande de paiement (le client reçoit un pop-up sur son téléphone)
 * Le site (frontend) appelle CETTE route. Il n'a jamais accès au token Campay.
 */
app.post('/api/payer', async (req, res) => {
  const { amount, phone, orderId } = req.body;

  if (!amount || !phone || !orderId) {
    return res.status(400).json({ error: "Les champs 'amount', 'phone' et 'orderId' sont obligatoires." });
  }

  // Le numéro doit être au format international sans le "+", ex: 2376XXXXXXXX
  let cleanPhone = String(phone).replace(/\D/g, '');
  if (!cleanPhone.startsWith('237')) {
    cleanPhone = '237' + cleanPhone;
  }

  try {
    const response = await fetch(`${CAMPAY_BASE_URL}/collect/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${CAMPAY_PERMANENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: 'XAF',
        from: cleanPhone,
        description: `Commande TIOZANG ${orderId}`,
        external_reference: orderId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    // data contient normalement: reference, ussd_code, operator
    return res.json(data);
  } catch (err) {
    console.error('Erreur /api/payer :', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la demande de paiement.' });
  }
});

/**
 * 2) Vérifier manuellement le statut d'une transaction (utile pour un bouton "Vérifier mon paiement")
 */
app.get('/api/statut/:reference', async (req, res) => {
  try {
    const response = await fetch(`${CAMPAY_BASE_URL}/transaction/${req.params.reference}/`, {
      headers: { Authorization: `Token ${CAMPAY_PERMANENT_TOKEN}` },
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('Erreur /api/statut :', err);
    return res.status(500).json({ error: 'Erreur lors de la vérification du statut.' });
  }
});

/**
 * 3) Webhook : Campay appelle CETTE route automatiquement quand le client a validé (ou refusé) le paiement.
 * C'est ICI que la commande passe vraiment en "payée" — sans aucune action manuelle de ta part.
 * Donne cette URL (ex: https://tonserveur.onrender.com/api/webhook/campay) dans le tableau de bord Campay.
 */
app.post('/api/webhook/campay', (req, res) => {
  const { reference, status, external_reference } = req.body;
  console.log(`Webhook Campay → commande ${external_reference} | réf ${reference} | statut ${status}`);

  // TODO : remplace ce console.log par une vraie mise à jour de commande
  // (base de données, ou appel à ton stockage de commandes) selon 'status' :
  //   'SUCCESSFUL' -> commande confirmée, à préparer/expédier
  //   'FAILED'     -> informer le client que le paiement a échoué

  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Serveur de paiement TIOZANG actif.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur TIOZANG en écoute sur le port ${PORT}`));
