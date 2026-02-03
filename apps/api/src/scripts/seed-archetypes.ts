/**
 * Seed Script: Business Archetypes
 * 
 * Populates the BusinessArchetype collection with starter data.
 * Run with: npm run seed:archetypes --workspace=@change/api
 */

import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { BusinessArchetype } from '../db/models/index.js';
import archetypesSeed from '../seeds/archetypes.seed.js';

async function seedArchetypes() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    console.log('Seeding business archetypes...');
    
    // Upsert each archetype (update if exists, insert if not)
    for (const archetype of archetypesSeed) {
      const result = await BusinessArchetype.findOneAndUpdate(
        { key: archetype.key },
        archetype,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  - ${result.isNew ? 'Created' : 'Updated'}: ${archetype.name} (${archetype.key})`);
    }

    console.log(`\nSeeded ${archetypesSeed.length} archetypes successfully!`);
    
    // Display summary
    const count = await BusinessArchetype.countDocuments();
    console.log(`Total archetypes in database: ${count}`);
    
  } catch (error) {
    console.error('Error seeding archetypes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

seedArchetypes();
