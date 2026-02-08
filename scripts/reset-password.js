/**
 * Password Reset Script
 * Run this locally to reset an admin password
 * 
 * Usage:
 *   1. Update the configuration below
 *   2. Run: node scripts/reset-password.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ============================================
// CONFIGURATION - Update these values
// ============================================

// Your MongoDB connection string (from Railway or MongoDB Atlas)
// NOTE: Must include database name and authSource
// Example: mongodb://user:pass@host:port/change_platform?authSource=admin
const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_CONNECTION_STRING_HERE';

// The email of the user whose password you want to reset
const USER_EMAIL = 'YOUR_EMAIL_HERE';

// The new password you want to set
const NEW_PASSWORD = 'YOUR_NEW_PASSWORD_HERE';

// ============================================
// Script - Don't modify below this line
// ============================================

async function resetPassword() {
  console.log('🔐 Password Reset Script');
  console.log('========================\n');
  
  // Validate configuration
  if (MONGODB_URI === 'YOUR_MONGODB_CONNECTION_STRING_HERE' || !MONGODB_URI) {
    console.error('❌ Error: Please set MONGODB_URI in the script or as an environment variable');
    process.exit(1);
  }
  
  if (USER_EMAIL === 'YOUR_EMAIL_HERE' || !USER_EMAIL) {
    console.error('❌ Error: Please set USER_EMAIL in the script');
    process.exit(1);
  }
  
  if (NEW_PASSWORD === 'YOUR_NEW_PASSWORD_HERE' || !NEW_PASSWORD) {
    console.error('❌ Error: Please set NEW_PASSWORD in the script');
    process.exit(1);
  }
  
  if (NEW_PASSWORD.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }
  
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');
    
    // Find the user first
    const user = await mongoose.connection.db.collection('users').findOne({ 
      email: USER_EMAIL.toLowerCase() 
    });
    
    if (!user) {
      console.error(`❌ Error: User with email "${USER_EMAIL}" not found`);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`👤 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    
    // Hash the new password
    console.log('🔒 Hashing new password...');
    const hash = await bcrypt.hash(NEW_PASSWORD, 12);
    
    // Update the password
    console.log('📝 Updating password...');
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: USER_EMAIL.toLowerCase() },
      { 
        $set: { 
          passwordHash: hash,
          passwordChangedAt: new Date(),
          mustChangePassword: false
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Password reset successfully!');
      console.log(`\n📧 Email: ${USER_EMAIL}`);
      console.log('🔑 You can now log in with your new password.\n');
    } else {
      console.error('\n❌ Failed to update password');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

resetPassword();
