const mysql = require('mysql2/promise');

async function simpleDebug() {
    console.log('🔄 Diagnostic simple du problème');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'immigration_production'
    });
    console.log('✅ Connexion établie');

    try {
        // 1. Vérifier l'utilisateur de test
        const testEmail = 'hamza@example.com';
        const [user] = await connection.execute(`
            SELECT id, nom, prenom, CONCAT(prenom, ' ', nom) as nom_complet, actif
            FROM users 
            WHERE email = ? AND role = 'conseillere'
        `, [testEmail]);
        
        if (user.length === 0) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }
        
        const userData = user[0];
        console.log(`\n1. 👤 Utilisateur: ${userData.nom_complet} (ID: ${userData.id})`);
        
        // 2. Vérifier les leads assignés
        const [assignedLeads] = await connection.execute(`
            SELECT id, nom, prenom, conseillere, conseiller_id, statut
            FROM leads 
            WHERE conseiller_id = ? OR conseillere = ?
            ORDER BY id DESC
            LIMIT 10
        `, [userData.id, userData.nom_complet]);
        
        console.log(`\n2. 📋 Leads assignés: ${assignedLeads.length}`);
        
        if (assignedLeads.length > 0) {
            assignedLeads.forEach(lead => {
                console.log(`   - Lead #${lead.id}: ${lead.prenom} ${lead.nom} (${lead.statut})`);
            });
        } else {
            console.log('   ⚠️  Aucun lead assigné trouvé');
        }
        
        // 3. Tester le filtrage frontend
        const [allLeads] = await connection.execute(`
            SELECT id, nom, prenom, conseillere, conseiller_id, statut
            FROM leads 
            ORDER BY id DESC
            LIMIT 20
        `);
        
        console.log(`\n3. 🔍 Test du filtrage frontend:`);
        console.log(`   Total leads: ${allLeads.length}`);
        
        const userName = userData.nom_complet;
        const filteredLeads = allLeads.filter(lead => {
            if (!lead.conseillere) return true; // Leads non assignés
            return lead.conseillere.toLowerCase().includes(userName.toLowerCase()) ||
                   userName.toLowerCase().includes(lead.conseillere.toLowerCase());
        });
        
        console.log(`   Leads filtrés pour "${userName}": ${filteredLeads.length}`);
        
        if (filteredLeads.length > 0) {
            console.log('   📝 Leads qui devraient s\'afficher:');
            filteredLeads.forEach(lead => {
                console.log(`      - Lead #${lead.id}: ${lead.prenom} ${lead.nom} (conseillère: "${lead.conseillere || 'Non assigné'}")`);
            });
        }
        
        // 4. Vérifier les serveurs
        console.log(`\n4. 🔧 ACTIONS À EFFECTUER:`);
        
        if (assignedLeads.length === 0) {
            console.log('   ❌ PROBLÈME: Aucun lead assigné');
            console.log('   💡 SOLUTION: Assigner des leads à cette conseillère');
            
            // Proposer d'assigner un lead de test
            const [unassignedLeads] = await connection.execute(`
                SELECT id, nom, prenom, statut
                FROM leads 
                WHERE conseiller_id IS NULL OR conseillere IS NULL OR conseillere = ''
                LIMIT 3
            `);
            
            if (unassignedLeads.length > 0) {
                console.log('   📝 Leads non assignés disponibles:');
                unassignedLeads.forEach(lead => {
                    console.log(`      - Lead #${lead.id}: ${lead.prenom} ${lead.nom}`);
                });
                
                console.log(`\n   🔧 Pour assigner le lead #${unassignedLeads[0].id} à ${userData.nom_complet}:`);
                console.log(`   UPDATE leads SET conseiller_id = ${userData.id}, conseillere = '${userData.nom_complet}' WHERE id = ${unassignedLeads[0].id};`);
            }
        } else {
            console.log('   ✅ Des leads sont assignés');
            console.log('   🔧 Vérifiez que:');
            console.log('   1. Les serveurs backend et frontend sont redémarrés');
            console.log('   2. Vous êtes connecté avec hamza@example.com / password123');
            console.log(`   3. localStorage.userName contient "${userData.nom_complet}"`);
            console.log('   4. Aucune erreur dans la console du navigateur');
        }
        
        // 5. Créer un lead de test
        console.log(`\n5. 🧪 Création d'un lead de test:`);
        
        const [insertResult] = await connection.execute(`
            INSERT INTO leads (nom, prenom, email, telephone, source, interet, conseillere, conseiller_id, statut, date_creation, date_modification)
            VALUES ('Test', 'Lead', 'test@example.com', '1234567890', 'Web', 'Études', ?, ?, 'Nouveau', NOW(), NOW())
        `, [userData.nom_complet, userData.id]);
        
        console.log(`   ✅ Lead de test créé avec ID: ${insertResult.insertId}`);
        console.log(`   📝 Lead: Lead Test assigné à ${userData.nom_complet}`);
        
        // 6. Vérification finale
        const [finalCheck] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM leads 
            WHERE conseiller_id = ? OR conseillere = ?
        `, [userData.id, userData.nom_complet]);
        
        console.log(`\n6. ✅ RÉSULTAT FINAL:`);
        console.log(`   Leads assignés à ${userData.nom_complet}: ${finalCheck[0].count}`);
        console.log(`   Le système devrait maintenant fonctionner !`);
        
        console.log(`\n🎯 INSTRUCTIONS DE TEST:`);
        console.log(`   1. Redémarrez les serveurs`);
        console.log(`   2. Connectez-vous avec hamza@example.com / password123`);
        console.log(`   3. Vérifiez que vous voyez ${finalCheck[0].count} lead(s) dans l'interface`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await connection.end();
    }
}

simpleDebug().catch(console.error); 