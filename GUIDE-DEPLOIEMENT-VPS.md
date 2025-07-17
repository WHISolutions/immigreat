# Guide de déploiement sur VPS Ubuntu - Hostinger

## 🎯 **Déploiement étape par étape**

### **1. Connexion au VPS**
```bash
# Connexion SSH (utilisez vos identifiants Hostinger)
ssh root@195.35.14.15

# Ou si vous avez configuré un utilisateur
ssh votre-utilisateur@195.35.14.15
```

### **2. Préparation du serveur**
```bash
# Télécharger et exécuter le script de setup
wget https://raw.githubusercontent.com/WHISolutions/immigreat/main/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh

# Redémarrer le serveur
sudo reboot
```

### **3. Déploiement de l'application**
```bash
# Se reconnecter après redémarrage
ssh root@195.35.14.15

# Aller dans le répertoire de déploiement
cd /opt/immigreat

# Cloner votre repository
git clone https://github.com/WHISolutions/immigreat.git .

# Ou copier vos fichiers manuellement via SCP
# scp -r ./app2/* root@195.35.14.15:/opt/immigreat/

# Configurer les variables d'environnement
cp .env.production .env
nano .env  # Modifier avec vos vraies valeurs

# Rendre les scripts exécutables
chmod +x deploy-vps.sh
chmod +x wait-for-it.sh

# Déployer l'application
./deploy-vps.sh
```

## 🔧 **Commandes de gestion**

### **Démarrage/Arrêt des services**
```bash
cd /opt/immigreat

# Démarrer tous les services
docker-compose -f docker-compose.prod.yml up -d

# Arrêter tous les services
docker-compose -f docker-compose.prod.yml down

# Redémarrer l'application seulement
docker-compose -f docker-compose.prod.yml restart app

# Voir les logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f app
```

### **Monitoring et maintenance**
```bash
# Statut des conteneurs
docker-compose -f docker-compose.prod.yml ps

# Utilisation des ressources
docker stats

# Espace disque
df -h

# Logs d'erreur
docker-compose -f docker-compose.prod.yml logs app | grep -i error

# Nettoyage des anciens containers/images
docker system prune -a
```

### **Sauvegarde de la base de données**
```bash
# Sauvegarde manuelle
docker-compose -f docker-compose.prod.yml exec db mysqldump -u root -p immigration_production > backup_$(date +%Y%m%d).sql

# Restaurer une sauvegarde
docker-compose -f docker-compose.prod.yml exec -T db mysql -u root -p immigration_production < backup_20241217.sql
```

## 🌐 **Configuration du domaine**

### **Option 1: Utilisation de l'IP publique**
Votre application sera accessible via:
```
http://195.35.14.15:3000
```

### **Option 2: Configuration d'un domaine**
1. **Ajouter un enregistrement DNS A** pointant vers `195.35.14.15`
2. **Modifier nginx-prod.conf**:
```nginx
server_name votre-domaine.com www.votre-domaine.com;
```
3. **Configurer SSL avec Let's Encrypt**:
```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Redémarrer Nginx
docker-compose restart nginx
```

## 🔒 **Sécurisation**

### **Firewall UFW**
```bash
# Vérifier le statut
sudo ufw status

# Autoriser seulement les ports nécessaires
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### **Fail2Ban (protection contre les attaques)**
```bash
# Installer Fail2Ban
sudo apt install fail2ban

# Configuration basique
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **Mises à jour automatiques**
```bash
# Configurer les mises à jour automatiques
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 **Monitoring**

### **Logs applicatifs**
```bash
# Logs de l'application
tail -f /var/log/immigreat/deploy.log

# Logs Docker
docker-compose -f docker-compose.prod.yml logs -f

# Logs système
sudo journalctl -f
```

### **Monitoring des ressources**
```bash
# CPU et mémoire
htop

# Espace disque
df -h

# Processus Docker
docker stats --no-stream
```

## 🚨 **Dépannage**

### **Application ne démarre pas**
```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs app

# Vérifier la configuration
docker-compose -f docker-compose.prod.yml config

# Redémarrer complètement
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### **Base de données inaccessible**
```bash
# Vérifier MySQL
docker-compose -f docker-compose.prod.yml exec db mysql -u root -p

# Recréer la base si nécessaire
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### **Problème de mémoire**
```bash
# Ajouter du swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 📞 **Support**

### **Commandes de diagnostic**
```bash
# Information système
uname -a
cat /etc/os-release
free -h
df -h

# État Docker
docker version
docker-compose version
docker ps -a

# Réseau
netstat -tlnp
curl -I http://localhost:3000
```

### **Sauvegarde complète**
```bash
# Créer une sauvegarde complète
tar -czf immigreat_backup_$(date +%Y%m%d).tar.gz /opt/immigreat
```

## 🎉 **Après le déploiement**

Votre application sera accessible à:
- **Application**: http://195.35.14.15:3000
- **API**: http://195.35.14.15:3000/api
- **Base de données**: localhost:3306 (accessible depuis le serveur seulement)

**Note**: Remplacez `195.35.14.15` par l'IP réelle de votre VPS Hostinger.
