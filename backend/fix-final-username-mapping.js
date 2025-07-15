const mysql = require('mysql2/promise');

async function fixFinalUsernameMapping() {
    console.log('🔄 Configuration MySQL initialisée');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'immigration_production'
    });
    console.log('✅ Connexion à la base de données établie');

    try {
        // 1. Corriger les incohérences détectées dans le diagnostic
        console.log('\n1. 🔧 Correction des incohérences détectées:');
        
        // Corriger les leads #119 et #120 qui ont Marie Tremblay (ID: 29) mais nom "HASSNA HAJJI"
        console.log('\n   📝 Correction des leads #119 et #120:');
        const [updateResult1] = await connection.execute(`
            UPDATE leads 
            SET conseillere = 'Marie Tremblay' 
            WHERE id IN (119, 120) AND conseiller_id = 29
        `);
        console.log(`      ✅ ${updateResult1.affectedRows} lead(s) corrigé(s) pour Marie Tremblay`);
        
        // 2. Synchroniser tous les leads avec les noms corrects
        console.log('\n2. 🔄 Synchronisation complète des noms:');
        
        const [users] = await connection.execute(`
            SELECT id, nom, prenom, CONCAT(prenom, ' ', nom) as nom_complet
            FROM users 
            WHERE role = 'conseillere'
        `);
        
        console.log(`   📊 ${users.length} conseillères trouvées dans la base`);
        
        let totalCorrected = 0;
        for (const user of users) {
            const [updateResult] = await connection.execute(`
                UPDATE leads 
                SET conseillere = ? 
                WHERE conseiller_id = ? AND (conseillere IS NULL OR conseillere != ?)
            `, [user.nom_complet, user.id, user.nom_complet]);
            
            if (updateResult.affectedRows > 0) {
                console.log(`      ✅ ${updateResult.affectedRows} lead(s) corrigé(s) pour ${user.nom_complet} (ID: ${user.id})`);
                totalCorrected += updateResult.affectedRows;
            }
        }
        
        console.log(`\n   📈 Total des corrections: ${totalCorrected} lead(s)`);
        
        // 3. Nettoyer les leads orphelins (conseillere sans conseiller_id)
        console.log('\n3. 🧹 Nettoyage des leads orphelins:');
        
        const [orphanLeads] = await connection.execute(`
            SELECT id, nom, prenom, conseillere, conseiller_id
            FROM leads 
            WHERE conseillere IS NOT NULL 
            AND conseillere != '' 
            AND conseiller_id IS NULL
        `);
        
        console.log(`   📊 ${orphanLeads.length} lead(s) orphelin(s) trouvé(s)`);
        
        for (const lead of orphanLeads) {
            // Essayer de trouver une correspondance
            const [matchedUsers] = await connection.execute(`
                SELECT id, CONCAT(prenom, ' ', nom) as nom_complet
                FROM users 
                WHERE role = 'conseillere' 
                AND (
                    CONCAT(prenom, ' ', nom) = ? OR
                    CONCAT(prenom, ' ', nom) LIKE ? OR
                    ? LIKE CONCAT('%', prenom, '%') OR
                    ? LIKE CONCAT('%', nom, '%')
                )
            `, [lead.conseillere, `%${lead.conseillere}%`, lead.conseillere, lead.conseillere]);
            
            if (matchedUsers.length > 0) {
                const matchedUser = matchedUsers[0];
                const [updateResult] = await connection.execute(`
                    UPDATE leads 
                    SET conseiller_id = ?, conseillere = ?
                    WHERE id = ?
                `, [matchedUser.id, matchedUser.nom_complet, lead.id]);
                
                console.log(`      ✅ Lead #${lead.id} (${lead.prenom} ${lead.nom}) assigné à ${matchedUser.nom_complet} (ID: ${matchedUser.id})`);
            } else {
                console.log(`      ⚠️  Lead #${lead.id} (${lead.prenom} ${lead.nom}) - Aucune correspondance trouvée pour "${lead.conseillere}"`);
            }
        }
        
        // 4. Rapport final
        console.log('\n4. 📊 RAPPORT FINAL:');
        
        const [finalStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_leads,
                COUNT(CASE WHEN conseiller_id IS NOT NULL THEN 1 END) as leads_assignes,
                COUNT(CASE WHEN conseiller_id IS NULL THEN 1 END) as leads_non_assignes
            FROM leads
        `);
        
        console.log(`   📈 Total des leads: ${finalStats[0].total_leads}`);
        console.log(`   ✅ Leads assignés: ${finalStats[0].leads_assignes}`);
        console.log(`   ❌ Leads non assignés: ${finalStats[0].leads_non_assignes}`);
        
        // Vérifier les incohérences restantes
        const [remainingIssues] = await connection.execute(`
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
            HAVING COUNT(l1.id) != COUNT(l2.id)
        `);
        
        if (remainingIssues.length > 0) {
            console.log('\n   ⚠️  Incohérences restantes:');
            remainingIssues.forEach(issue => {
                console.log(`      - ${issue.user_nom_complet}: ${issue.leads_avec_nom} avec nom, ${issue.leads_avec_id} avec ID`);
            });
        } else {
            console.log('\n   ✅ Aucune incohérence restante détectée');
        }
        
        // 5. Instructions pour le frontend
        console.log('\n5. 🎯 INSTRUCTIONS POUR LE FRONTEND:');
        console.log('   A. Le localStorage.userName doit contenir le nom complet (prénom + nom)');
        console.log('   B. Exemple: "hamza adile", "wafaa chaouby", "Marie Tremblay"');
        console.log('   C. Modifier App.tsx ligne 102 pour utiliser CONCAT(prenom, " ", nom)');
        console.log('   D. Ou modifier le backend pour retourner le nom complet dans response.user.nom');
        
        // 6. Afficher les correspondances exactes attendues
        console.log('\n6. 📋 CORRESPONDANCES EXACTES ATTENDUES:');
        users.forEach(user => {
            console.log(`   - Email: ${user.email || 'N/A'} → localStorage.userName: "${user.nom_complet}"`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await connection.end();
    }
}

fixFinalUsernameMapping().catch(console.error); 