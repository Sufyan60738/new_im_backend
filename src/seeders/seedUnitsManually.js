/**
 * Manual Seeder Script for Predefined Units
 * Seeds the predefined_units table with standard measurement units
 * 
 * Usage: node src/seeders/seedUnitsManually.js
 */

const sequelize = require('../config/sequelize');
const PredefinedUnit = require('../models/PredefinedUnit');
const { getAllPredefinedUnits, getTotalUnitsCount } = require('./predefinedUnits');

const seedUnits = async () => {
    try {
        console.log('🌱 Starting predefined units seeding...\n');

        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connected successfully\n');

        // Sync PredefinedUnit model
        await PredefinedUnit.sync({ alter: true });
        console.log('✅ PredefinedUnit table synced\n');

        // Get all units to seed
        const unitsToSeed = getAllPredefinedUnits();
        console.log(`📋 Total units to seed: ${unitsToSeed.length} units\n`);

        let created = 0;
        let existing = 0;

        // Seed each unit (using findOrCreate for safety)
        for (const unit of unitsToSeed) {
            const [instance, isCreated] = await PredefinedUnit.findOrCreate({
                where: { name: unit.name },
                defaults: { name: unit.name, category: unit.category }
            });

            if (isCreated) {
                created++;
                console.log(`✓ Created: ${unit.name.padEnd(20)} [${unit.category}]`);
            } else {
                existing++;
            }
        }

        // Final summary
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 Seeding completed successfully!');
        console.log('═'.repeat(60));
        console.log(`📝 New units created:      ${created}`);
        console.log(`✓  Already existing:       ${existing}`);
        console.log(`📊 Total units in DB:      ${created + existing}`);
        console.log('═'.repeat(60));

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding units:', error.message);
        console.error('Stack:', error.stack);
        await sequelize.close();
        process.exit(1);
    }
};

// Run seeder
seedUnits();
