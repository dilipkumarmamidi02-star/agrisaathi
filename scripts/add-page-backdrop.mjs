import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

const PAGES_DIR = path.resolve('src/pages');
const SKIP = new Set(['Login.jsx', 'Register.jsx', 'Weather.jsx', 'PestLibrary.jsx']);

// Known good search queries per page. Anything not listed falls back to a
// humanized version of the filename.
const QUERY_MAP = {
  'Dashboard.jsx': 'indian farm aerial view',
  'Home.jsx': 'indian farm field morning',
  'Diagnose.jsx': 'crop disease diagnosis',
  'Fertilizer.jsx': 'fertilizer spreading field',
  'Fertilize.jsx': 'fertilizer spreading field',
  'IrrigationPlanner.jsx': 'drip irrigation farm field',
  'SensorLab.jsx': 'soil testing lab',
  'CropPlanner.jsx': 'crop planning field',
  'CropPassport.jsx': 'crop field certification',
  'Crops.jsx': 'crop field india',
  'Livestock.jsx': 'indian cattle farm',
  'LivestockCare.jsx': 'livestock health care farm',
  'AnimalEncyclopedia.jsx': 'farm animals india',
  'AnimalEncyclopediaDetail.jsx': 'farm animal closeup',
  'CropEncyclopediaDetail.jsx': 'crop closeup field',
  'MarketPrices.jsx': 'indian mandi market',
  'GovernmentSchemes.jsx': 'government documents farmer',
  'Schemes.jsx': 'government documents farmer',
  'InsuranceHub.jsx': 'crop insurance farmer',
  'InsuranceVault.jsx': 'crop insurance documents',
  'LoanCalculator.jsx': 'farmer bank loan',
  'LoanEligibility.jsx': 'farmer bank loan',
  'FarmLedger.jsx': 'farm accounting ledger',
  'ExpenseAnalytics.jsx': 'farm expenses accounting',
  'HarvestRecords.jsx': 'harvest field india',
  'YieldBenchmarks.jsx': 'crop yield field',
  'SoilPassport.jsx': 'soil testing field',
  'SensorHub.jsx': 'agriculture sensor field',
  'WeatherAnalytics.jsx': 'weather clouds field',
  'WeatherAlerts.jsx': 'storm clouds farm',
  'TrainingCenter.jsx': 'farmer training workshop',
  'TrainingAcademy.jsx': 'farmer training workshop',
  'Community.jsx': 'farmers community meeting',
  'CommunityForum.jsx': 'farmers community meeting',
  'SuccessStories.jsx': 'happy farmer field',
  'FeedbackCorner.jsx': 'farmer feedback discussion',
  'ExpertDirectory.jsx': 'agriculture expert consultation',
  'NearMe.jsx': 'rural india map',
  'SupportTickets.jsx': 'farmer support helpdesk',
  'DocumentWallet.jsx': 'farm documents paperwork',
  'InputMarketplace.jsx': 'agriculture market stall',
  'ResourceMarketplace.jsx': 'agriculture market stall',
  'VendorContacts.jsx': 'agriculture vendor shop',
  'EquipmentRegistry.jsx': 'farm equipment tractor',
  'InventoryTracker.jsx': 'farm storage inventory',
  'TaskManager.jsx': 'farmer daily tasks field',
  'FarmNotifications.jsx': 'farm alert notification',
  'AlertsCenter.jsx': 'farm alert notification',
  'Treatments.jsx': 'crop treatment spraying',
  'SustainabilityScore.jsx': 'sustainable farming green field',
  'DataGovLiveData.jsx': 'agriculture data statistics',
  'SpeakToAgriSaathi.jsx': 'farmer speaking microphone',
  'VoiceNotes.jsx': 'farmer speaking microphone',
  'ExportReports.jsx': 'farm report documents',
  'ExportData.jsx': 'farm report documents',
  'ProfileSettings.jsx': 'farmer portrait field',
  'ForgotPassword.jsx': 'farmer ploughing field with oxen',
  'ResetPassword.jsx': 'farmer ploughing field with oxen',
  'OAuthConsent.jsx': 'farmer ploughing field with oxen',
  'Placeholder.jsx': 'indian agriculture farm',
};

function humanize(filename) {
  const base = filename.replace(/\.jsx$/, '');
  return base.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
}

const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.jsx') && !SKIP.has(f));

let changed = 0;
let skippedNoReturn = [];

for (const file of files) {
  const filePath = path.join(PAGES_DIR, file);
  const code = fs.readFileSync(filePath, 'utf8');

  if (code.includes("from '../components/PageBackdrop'")) {
    continue; // already has it
  }

  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    console.error(`PARSE FAIL: ${file}: ${e.message}`);
    continue;
  }

  const query = QUERY_MAP[file] || humanize(file);
  let outerFnPath = null;
  let wrapped = 0;

  // Find the default-exported function (component)
  traverse(ast, {
    ExportDefaultDeclaration(p) {
      const decl = p.node.declaration;
      if (t.isFunctionDeclaration(decl)) {
        outerFnPath = p.get('declaration');
      }
    },
  });

  if (!outerFnPath) {
    skippedNoReturn.push(file);
    continue;
  }

  outerFnPath.traverse({
    ReturnStatement(retPath) {
      if (retPath.getFunctionParent() !== outerFnPath) return; // don't touch .map() callbacks etc
      const arg = retPath.node.argument;
      if (!arg) return;
      if (!t.isJSXElement(arg) && !t.isJSXFragment(arg)) return;

      const wrapper = t.jsxElement(
        t.jsxOpeningElement(
          t.jsxIdentifier('PageBackdrop'),
          [t.jsxAttribute(t.jsxIdentifier('query'), t.stringLiteral(query))]
        ),
        t.jsxClosingElement(t.jsxIdentifier('PageBackdrop')),
        [arg],
        false
      );
      retPath.node.argument = wrapper;
      wrapped++;
    },
  });

  if (wrapped === 0) {
    skippedNoReturn.push(file);
    continue;
  }

  // Insert the import after the last existing import statement
  let lastImportPath = null;
  traverse(ast, {
    ImportDeclaration(p) {
      lastImportPath = p;
    },
  });
  const importStmt = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier('PageBackdrop'))],
    t.stringLiteral('../components/PageBackdrop')
  );
  if (lastImportPath) {
    lastImportPath.insertAfter(importStmt);
  } else {
    ast.program.body.unshift(importStmt);
  }

  const output = generate(ast, { retainLines: false, jsescOption: { quotes: 'single' } }, code).code;
  fs.writeFileSync(filePath, output);
  changed++;
  console.log(`OK  ${file}  (query: "${query}", wrapped ${wrapped} return[s])`);
}

console.log(`\nDone. Modified ${changed} files.`);
if (skippedNoReturn.length) {
  console.log(`\nSkipped (no matching JSX return found — check manually):`);
  skippedNoReturn.forEach((f) => console.log(' -', f));
}
