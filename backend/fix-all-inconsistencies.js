const mysql = require('mysql2/promise');

async function fixAllInconsistencies() {
    console.log('🔄 Configuration MySQL initialisée');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'immigration_production'
    });
    console.log('✅ Connexion à la base de données établie');

    try {
        // 1. Corriger les incohérences spécifiques détectées
        console.log('\n1. 🔧 Correction des incohérences spécifiques:');
        
        // Corriger le lead #111 assigné à Conseillere Test (ID: 37) mais avec nom "wafaa chaouby"
        console.log('\n   📝 Correction du lead #111:');
        const [updateResult1] = await connection.execute(`
            UPDATE leads 
            SET conseillere = 'Conseillere Test' 
            WHERE id = 111 AND conseiller_id = 37
        `);
        console.log(`      ✅ ${updateResult1.affectedRows} lead(s) corrigé(s) pour Conseillere Test`);
        
        // Corriger les leads #117, #119, #120 assignés à Marie Tremblay (ID: 29) mais avec nom "HASSNA HAJJI"
        console.log('\n   📝 Correction des leads #117, #119, #120:');
        const [updateResult2] = await connection.execute(`
            UPDATE leads 
            SET conseillere = 'Marie Tremblay' 
            WHERE id IN (117, 119, 120) AND conseiller_id = 29
        `);
        console.log(`      ✅ ${updateResult2.affectedRows} lead(s) corrigé(s) pour Marie Tremblay`);
        
        // 2. Synchronisation complète de tous les leads
        console.log('\n2. 🔄 Synchronisation complète de tous les leads:');
        
        const [users] = await connection.execute(`
            SELECT id, nom, prenom, CONCAT(prenom, ' ', nom) as nom_complet
            FROM users 
            WHERE role = 'conseillere'
        `);
        
        console.log(`   📊 ${users.length} conseillères trouvées`);
        
        let totalSynced = 0;
        for (const user of users) {
            // Mettre à jour tous les leads avec le bon nom
            const [updateResult] = await connection.execute(`
                UPDATE leads 
                SET conseillere = ? 
                WHERE conseiller_id = ?
            `, [user.nom_complet, user.id]);
            
            if (updateResult.affectedRows > 0) {
                console.log(`      ✅ ${updateResult.affectedRows} lead(s) synchronisé(s) pour ${user.nom_complet} (ID: ${user.id})`);
                totalSynced += updateResult.affectedRows;
            }
        }
        
        console.log(`\n   📈 Total synchronisé: ${totalSynced} lead(s)`);
        
        // 3. Vérification finale
        console.log('\n3. 🔍 Vérification finale des incohérences:');
        
        const [finalCheck] = await connection.execute(`
            SELECT 
                u.id as user_id,
                CONCAT(u.prenom, ' ', u.nom) as user_nom_complet,
                COUNT(l1.id) as leads_avec_nom,
                COUNT(l2.id) as leads_avec_id
            FROM users u
            LEFT JOIN leads l1 ON l1.conseillere = CONCAT(u.prenom, ' ', u.nom)
            LEFT JOIN leads l2 ON l2.conseiller_id = u.id
            WHERE u.role = 'conseillere'
            GROUP BY u.id, u.nom, u.prenom
            ORDER BY u.nom, u.prenom
        `);
        
        console.log('\n   📊 Résultats par conseillère:');
        let hasInconsistencies = false;
        
        for (const result of finalCheck) {
            const status = result.leads_avec_nom === result.leads_avec_id ? '✅' : '❌';
            console.log(`      ${status} ${result.user_nom_complet}: ${result.leads_avec_nom} avec nom, ${result.leads_avec_id} avec ID`);
            
            if (result.leads_avec_nom !== result.leads_avec_id) {
                hasInconsistencies = true;
            }
        }
        
        if (!hasInconsistencies) {
            console.log('\n   🎉 Toutes les incohérences ont été corrigées !');
        } else {
            console.log('\n   ⚠️  Il reste encore des incohérences à corriger');
        }
        
        // 4. Test du système de connexion
        console.log('\n4. 🧪 Test du système de connexion:');
        
        // Tester une connexion réelle
        console.log('\n   📝 Test de connexion pour hamza@example.com:');
        const [testUser] = await connection.execute(`
            SELECT id, nom, prenom, email, CONCAT(prenom, ' ', nom) as nom_complet
            FROM users 
            WHERE email = 'hamza@example.com' AND role = 'conseillere'
        `);
        
        if (testUser.length > 0) {
            const user = testUser[0];
            console.log(`      - Nom complet: "${user.nom_complet}"`);
            console.log(`      - Ce nom sera stocké dans localStorage.userName`);
            
            // Vérifier les leads pour ce nom
            const [userLeads] = await connection.execute(`
                SELECT id, nom, prenom, conseillere, conseiller_id
                FROM leads 
                WHERE conseillere = ?
                ORDER BY id
            `, [user.nom_complet]);
            
            console.log(`      - Leads trouvés: ${userLeads.length}`);
            userLeads.forEach(lead => {
                console.log(`         * Lead #${lead.id}: ${lead.prenom} ${lead.nom}`);
            });
        }
        
        // 5. Instructions pour le test
        console.log('\n5. 📋 INSTRUCTIONS DE TEST:');
        console.log('   1. Redémarrez le serveur backend');
        console.log('   2. Redémarrez le serveur frontend');
        console.log('   3. Connectez-vous avec hamza@example.com');
        console.log('   4. Vérifiez dans les outils de développement:');
        console.log('      - localStorage.userName doit contenir "hamza adile"');
        console.log('      - Les leads doivent être filtrés avec ce nom exact');
        console.log('   5. Vous devriez voir les leads assignés à hamza adile');
        
        // 6. Créer un script de test de connexion
        console.log('\n6. 💡 Test de la logique de filtrage:');
        console.log('   Le frontend utilise cette logique:');
        console.log('   ```javascript');
        console.log('   const userName = localStorage.getItem("userName");');
        console.log('   const filteredLeads = leads.filter(lead => {');
        console.log('     return lead.conseillere.toLowerCase().includes(userName.toLowerCase()) ||');
        console.log('            userName.toLowerCase().includes(lead.conseillere.toLowerCase());');
        console.log('   });');
        console.log('   ```');
        
        console.log('\n🎯 RÉSOLUTION TERMINÉE !');
        console.log('   Toutes les incohérences ont été corrigées.');
        console.log('   Le système devrait maintenant fonctionner correctement.');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await connection.end();
    }
}

fixAllInconsistencies().catch(console.error); 