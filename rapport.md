4.1. Inscription publique permettant de choisir MANAGER
Où : backend/src/controller/auth.ts:32-35, shared/src/schema/user.ts:8-20, backend/src/service/user.service.ts:13-29.
Le endpoint POST /v1/auth/register accepte le rôle fourni par le client et l’enregistre directement :
role: user.role
Le schéma partagé expose lui-même role dans UserInputRegistration. Un utilisateur non authentifié peut donc créer un compte MANAGER, puis accéder aux endpoints protégés par RolesGuard.
Risque concret : prise de contrôle fonctionnelle d’un restaurant : validation des commandes, accès aux données et opérations réservées au management.

Fait exprès pour tester facilement