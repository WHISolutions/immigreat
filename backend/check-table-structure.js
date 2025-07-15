const mysql = require('mysql2/promise');

async function checkTableStructure() {
    console.log('🔄 Configuration MySQL initialisée');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'immigration_production'
    });
    console.log('✅ Connexion à la base de données établie');

    try {
        // Vérifier la structure de la table users
        console.log('\n1. 🏗️ Structure de la table users:');
        const [usersColumns] = await connection.execute('DESCRIBE users');
        usersColumns.forEach(column => {
            console.log(`   - ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Vérifier la structure de la table leads
        console.log('\n2. 🏗️ Structure de la table leads:');
        const [leadsColumns] = await connection.execute('DESCRIBE leads');
        leadsColumns.forEach(column => {
            console.log(`   - ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Vérifier quelques utilisateurs conseillères
        console.log('\n3. 👥 Échantillon d\'utilisateurs conseillères:');
        const [users] = await connection.execute(`
            SELECT * FROM users 
            WHERE role = 'conseillere' 
            LIMIT 5
        `);
        
        if (users.length > 0) {
            console.log('   Colonnes disponibles:', Object.keys(users[0]).join(', '));
            users.forEach(user => {
                console.log(`   - ID: ${user.id}, Nom: ${user.nom || user.name || user.username || 'N/A'}, Email: ${user.email}`);
            });
        }

        // Vérifier quelques leads
        console.log('\n4. 📋 Échantillon de leads:');
        const [leads] = await connection.execute(`
            SELECT * FROM leads 
            WHERE conseiller_id IS NOT NULL 
            LIMIT 5
        `);
        
        if (leads.length > 0) {
            console.log('   Colonnes disponibles:', Object.keys(leads[0]).join(', '));
            leads.forEach(lead => {
                console.log(`   - ID: ${lead.id}, Nom: ${lead.nom} ${lead.prenom}, Conseiller ID: ${lead.conseiller_id}, Conseillere: ${lead.conseillere}`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await connection.end();
    }
}

checkTableStructure().catch(console.error);
