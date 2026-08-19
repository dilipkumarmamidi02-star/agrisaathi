import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AgriHelperWidget from './components/AgriHelperWidget.jsx';
import Home from './pages/Home.jsx';
import Diagnose from './pages/Diagnose.jsx';
import NearMe from './pages/NearMe.jsx';
import Crops from './pages/Crops.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Fertilize from './pages/Fertilize.jsx';
import SoilPassport from './pages/SoilPassport.jsx';
import CropPlanner from './pages/CropPlanner.jsx';
import Livestock from './pages/Livestock.jsx';
import MarketPrices from './pages/MarketPrices.jsx';
import Treatments from './pages/Treatments.jsx';
import SensorLab from './pages/SensorLab.jsx';
import FarmLedger from './pages/FarmLedger.jsx';
import CropPassport from './pages/CropPassport.jsx';
import GovernmentSchemes from './pages/GovernmentSchemes.jsx';
import IrrigationPlanner from './pages/IrrigationPlanner.jsx';
import HarvestRecords from './pages/HarvestRecords.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import VoiceNotes from './pages/VoiceNotes.jsx';
import LoanEligibility from './pages/LoanEligibility.jsx';
import CommunityForum from './pages/CommunityForum.jsx';
import WeatherAlerts from './pages/WeatherAlerts.jsx';
import InputMarketplace from './pages/InputMarketplace.jsx';
import TrainingCenter from './pages/TrainingCenter.jsx';
import DocumentWallet from './pages/DocumentWallet.jsx';
import InsuranceHub from './pages/InsuranceHub.jsx';
import InventoryTracker from './pages/InventoryTracker.jsx';
import ExportReports from './pages/ExportReports.jsx';
import SensorHub from './pages/SensorHub.jsx';
import LoanCalculator from './pages/LoanCalculator.jsx';
import ResourceMarketplace from './pages/ResourceMarketplace.jsx';
import TaskManager from './pages/TaskManager.jsx';
import TrainingAcademy from './pages/TrainingAcademy.jsx';
import ExpenseAnalytics from './pages/ExpenseAnalytics.jsx';
import YieldBenchmarks from './pages/YieldBenchmarks.jsx';
import SupportTickets from './pages/SupportTickets.jsx';
import EquipmentRegistry from './pages/EquipmentRegistry.jsx';
import AlertsCenter from './pages/AlertsCenter.jsx';
import PestLibrary from './pages/PestLibrary.jsx';
import SustainabilityScore from './pages/SustainabilityScore.jsx';
import ExportData from './pages/ExportData.jsx';
import ExpertDirectory from './pages/ExpertDirectory.jsx';
import InsuranceVault from './pages/InsuranceVault.jsx';
import FeedbackCorner from './pages/FeedbackCorner.jsx';
import SuccessStories from './pages/SuccessStories.jsx';
import WeatherAnalytics from './pages/WeatherAnalytics.jsx';
import FarmNotifications from './pages/FarmNotifications.jsx';
import VendorContacts from './pages/VendorContacts.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import OAuthConsent from './pages/OAuthConsent.jsx';

import AnimalEncyclopedia from './pages/AnimalEncyclopedia.jsx';
import AnimalEncyclopediaDetail from './pages/AnimalEncyclopediaDetail.jsx';
import CropEncyclopediaDetail from './pages/CropEncyclopediaDetail.jsx';
import Weather from './pages/Weather.jsx';
import Community from './pages/Community.jsx';
import DataGovLiveData from './pages/DataGovLiveData';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/near-me" element={<NearMe />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fertilizer" element={<Fertilize />} />
          <Route path="/soil-passport" element={<SoilPassport />} />
          <Route path="/crop-planner" element={<CropPlanner />} />
          <Route path="/livestock-care" element={<Livestock />} />
          <Route path="/market-prices" element={<MarketPrices />} />
          <Route path="/data-gov" element={<DataGovLiveData />} />
          <Route path="/treatments" element={<Treatments />} />
          <Route path="/sensor-lab" element={<SensorLab />} />
          <Route path="/farm-ledger" element={<FarmLedger />} />
          <Route path="/crop-passport" element={<CropPassport />} />
          <Route path="/schemes" element={<GovernmentSchemes />} />
          <Route path="/government-schemes" element={<Navigate to="/schemes" replace />} />
          <Route path="/irrigation-planner" element={<IrrigationPlanner />} />
          <Route path="/harvest-records" element={<HarvestRecords />} />
          <Route path="/profile-settings" element={<ProfileSettings />} />
          <Route path="/voice-notes" element={<VoiceNotes />} />
          <Route path="/loan-eligibility" element={<LoanEligibility />} />
          <Route path="/community-forum" element={<CommunityForum />} />
          <Route path="/weather-alerts" element={<WeatherAlerts />} />
          <Route path="/input-marketplace" element={<InputMarketplace />} />
          <Route path="/training-center" element={<TrainingCenter />} />
          <Route path="/document-wallet" element={<DocumentWallet />} />
          <Route path="/insurance-hub" element={<InsuranceHub />} />
          <Route path="/insurance" element={<Navigate to="/insurance-hub" replace />} />
          <Route path="/inventory-tracker" element={<InventoryTracker />} />
          <Route path="/inventory" element={<Navigate to="/inventory-tracker" replace />} />
          <Route path="/export-reports" element={<ExportReports />} />
          <Route path="/sensor-hub" element={<SensorHub />} />
          <Route path="/loan-calculator" element={<LoanCalculator />} />
          <Route path="/marketplace" element={<ResourceMarketplace />} />
          <Route path="/resource-marketplace" element={<Navigate to="/marketplace" replace />} />
          <Route path="/task-manager" element={<TaskManager />} />
          <Route path="/training-academy" element={<TrainingAcademy />} />
          <Route path="/expense-analytics" element={<ExpenseAnalytics />} />
          <Route path="/yield-benchmarks" element={<YieldBenchmarks />} />
          <Route path="/support-tickets" element={<SupportTickets />} />
          <Route path="/equipment-registry" element={<EquipmentRegistry />} />
          <Route path="/alerts-center" element={<AlertsCenter />} />
          <Route path="/pest-library" element={<PestLibrary />} />
          <Route path="/sustainability-score" element={<SustainabilityScore />} />
          <Route path="/export-data" element={<ExportData />} />
          <Route path="/expert-directory" element={<ExpertDirectory />} />
          <Route path="/insurance-hub-vault" element={<InsuranceVault />} />
          <Route path="/feedback-corner" element={<FeedbackCorner />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/weather-analytics" element={<WeatherAnalytics />} />
          <Route path="/farm-notifications" element={<FarmNotifications />} />
          <Route path="/vendor-contacts" element={<VendorContacts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth-consent" element={<OAuthConsent />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/community" element={<Community />} />
          <Route path="/animal-encyclopedia" element={<AnimalEncyclopedia />} />
          <Route path="/animal-encyclopedia/:categoryId/:typeId" element={<AnimalEncyclopediaDetail />} />
          <Route path="/crop-encyclopedia/:categoryId/:typeId" element={<CropEncyclopediaDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <AgriHelperWidget />
    </Router>
  );
}

export default App;
