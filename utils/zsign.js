import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

const ZSIGN_PATH = process.env.ZSIGN_PATH || '/usr/local/bin/zsign';

/**
 * Sign an IPA file with a certificate
 * @param {string} ipaPath - Path to the input IPA file
 * @param {string} p12Path - Path to the p12 certificate
 * @param {string} mobileprovisionPath - Path to the mobileprovision file
 * @param {string} password - Certificate password
 * @param {string} outputPath - Path for the output signed IPA
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
export async function signIPA(ipaPath, p12Path, mobileprovisionPath, password, outputPath) {
  try {
    // Validate input files exist
    if (!fs.existsSync(ipaPath)) throw new Error(`IPA file not found: ${ipaPath}`);
    if (!fs.existsSync(p12Path)) throw new Error(`P12 certificate not found: ${p12Path}`);
    if (!fs.existsSync(mobileprovisionPath)) throw new Error(`Mobileprovision not found: ${mobileprovisionPath}`);
    if (!fs.existsSync(ZSIGN_PATH)) throw new Error(`zsign tool not found at: ${ZSIGN_PATH}`);

    // Build zsign command
    const command = `"${ZSIGN_PATH}" -k "${p12Path}" -m "${mobileprovisionPath}" -p "${password}" -o "${outputPath}" "${ipaPath}"`;
    
    console.log('🔐 Executing signing command...');
    const { stdout, stderr } = await execPromise(command, {
      timeout: 120000, // 2 minutes timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr && !stderr.includes('Success')) {
      console.warn('⚠️ Warning:', stderr);
    }

    // Verify output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Signed IPA file was not created');
    }

    const stats = fs.statSync(outputPath);
    console.log(`✅ IPA signed successfully (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    return {
      success: true,
      path: outputPath,
      size: stats.size,
      message: 'IPA signed successfully'
    };
  } catch (error) {
    console.error('❌ Signing error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify zsign installation
 * @returns {Promise<boolean>}
 */
export async function verifyZsign() {
  try {
    const { stdout } = await execPromise(`"${ZSIGN_PATH}" --version`);
    console.log('✅ zsign verified:', stdout.trim());
    return true;
  } catch (error) {
    console.error('❌ zsign not found:', error.message);
    return false;
  }
}

export default { signIPA, verifyZsign };
