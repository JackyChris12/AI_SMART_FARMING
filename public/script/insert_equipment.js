
const mysql = require('mysql2/promise');

// Database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
});

// Sample data for randomization
const equipmentTypes = [
    'Tractor', 'Plow', 'Seed Planter', 'Harvester', 'Irrigation Pump',
    'Tiller', 'Hay Baler', 'Sprayer', 'Disc Harrow', 'Cultivator'
];
const brands = ['John Deere', 'Kubota', 'Massey Ferguson', 'Case IH', 'New Holland'];
const descriptions = [
    'Versatile equipment for large-scale farming.',
    'Reliable tool for medium-sized farms.',
    'Efficient for small plots.',
    'High-capacity machine for heavy-duty tasks.',
    'Ideal for precision agriculture.'
];
const ownerIds = [1, 2, 3]; // Replace with actual user IDs from users table

async function insertEquipment() {
    try {
        for (let i = 0; i < 100; i++) {
            const name = `${brands[Math.floor(Math.random() * brands.length)]} ${equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)]} ${Math.floor(Math.random() * 9000 + 1000)}`;
            const description = descriptions[Math.floor(Math.random() * descriptions.length)];
            const price_per_day = parseFloat((Math.random() * 9000 + 1000).toFixed(2));
            const owner_id = ownerIds[Math.floor(Math.random() * ownerIds.length)];

            await db.query(
                'INSERT INTO equipment (name, description, price_per_day, owner_id) VALUES (?, ?, ?, ?)',
                [name, description, price_per_day, owner_id]
            );
        }
        console.log('Inserted 100 equipment records successfully.');
    } catch (error) {
        console.error('Error inserting equipment:', error);
    } finally {
        await db.end();
    }
}

insertEquipment();
