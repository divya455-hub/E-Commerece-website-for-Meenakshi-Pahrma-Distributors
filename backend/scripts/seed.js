/**
 * Database Seed Script
 * Clears all data and seeds 10 categories with ~250 products
 * Run: node scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/epharmacy';

// 19 available medicine images
const images = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    if (n === 3) return null; // image 3 doesn't exist
    return `/uploads/products/medicine_no_grid_6000x6000_${n}.png`;
}).filter(Boolean);

const randomImg = () => images[Math.floor(Math.random() * images.length)];

// ─── CATEGORIES ─────────────────────────────────────────────

const categoriesData = [
    { name: 'General Medicine', description: 'Common over-the-counter medicines for everyday health needs including fever, cold, allergies and infections.' },
    { name: 'Baby Care', description: 'Safe and gentle products for infants and toddlers including nutrition, skin care and hygiene.' },
    { name: 'Joint Care', description: 'Supplements and medicines for bone health, joint pain, arthritis and mobility support.' },
    { name: 'Pain Relief', description: 'Analgesics, anti-inflammatory drugs and topical solutions for pain management.' },
    { name: 'Wellness', description: 'Vitamins, minerals, immunity boosters and general wellness supplements.' },
    { name: 'Medical Equipment', description: 'Digital thermometers, BP monitors, glucometers, nebulizers and other medical devices.' },
    { name: 'Skin Care', description: 'Dermatologically tested creams, lotions, sunscreens and treatments for various skin conditions.' },
    { name: 'Digestive Health', description: 'Antacids, probiotics, laxatives and medicines for digestive comfort.' },
    { name: 'Eye & Ear Care', description: 'Eye drops, ear drops, contact lens solutions and related care products.' },
    { name: 'Respiratory Care', description: 'Inhalers, cough syrups, nasal sprays and medicines for breathing disorders.' },
];

// ─── PRODUCTS PER CATEGORY ──────────────────────────────────

const manufacturers = [
    'Cipla Ltd', 'Sun Pharma', 'Dr. Reddy\'s', 'Lupin', 'Aurobindo Pharma',
    'Zydus Cadila', 'Torrent Pharma', 'Glenmark', 'Mankind Pharma', 'Alkem Labs',
    'Abbott India', 'Pfizer', 'GSK Pharma', 'Johnson & Johnson', 'Himalaya Wellness',
    'Dabur', 'Biocon', 'Ajanta Pharma', 'Cadila Healthcare', 'Intas Pharma',
];

const productsMap = {
    'General Medicine': [
        { name: 'Paracetamol 500mg', desc: 'Effective pain reliever and fever reducer. Suitable for headache, body ache and common cold symptoms.', price: 45, cost: 30, rx: false },
        { name: 'Azithromycin 500mg', desc: 'Broad-spectrum antibiotic used to treat bacterial infections including respiratory and skin infections.', price: 185, cost: 120, rx: true },
        { name: 'Amoxicillin 500mg', desc: 'Penicillin-type antibiotic for bacterial infections of ear, nose, throat, urinary tract and skin.', price: 150, cost: 95, rx: true },
        { name: 'Cetirizine 10mg', desc: 'Antihistamine for allergy relief. Treats sneezing, runny nose, itchy eyes and hives.', price: 35, cost: 18, rx: false },
        { name: 'Metformin 500mg', desc: 'Oral diabetes medicine that helps control blood sugar levels in type 2 diabetes.', price: 55, cost: 30, rx: true },
        { name: 'Omeprazole 20mg', desc: 'Proton pump inhibitor for treating gastric acid-related disorders and heartburn.', price: 65, cost: 35, rx: false },
        { name: 'Ciprofloxacin 500mg', desc: 'Fluoroquinolone antibiotic for treating urinary tract, respiratory and gastrointestinal infections.', price: 120, cost: 70, rx: true },
        { name: 'Doxycycline 100mg', desc: 'Tetracycline antibiotic for treating acne, respiratory infections and tick-borne illnesses.', price: 95, cost: 55, rx: true },
        { name: 'Montelukast 10mg', desc: 'Leukotriene receptor antagonist for prevention and treatment of asthma and allergic rhinitis.', price: 140, cost: 80, rx: true },
        { name: 'Levocetirizine 5mg', desc: 'Third-generation antihistamine for chronic urticaria and allergic rhinitis.', price: 40, cost: 20, rx: false },
        { name: 'Pantoprazole 40mg', desc: 'Proton pump inhibitor for GERD, peptic ulcers and Zollinger-Ellison syndrome.', price: 75, cost: 40, rx: false },
        { name: 'Ranitidine 150mg', desc: 'H2 receptor antagonist for reducing stomach acid production and treating ulcers.', price: 50, cost: 28, rx: false },
        { name: 'Domperidone 10mg', desc: 'Anti-emetic for nausea, vomiting and stomach discomfort. Speeds up gastric emptying.', price: 42, cost: 22, rx: false },
        { name: 'Norfloxacin 400mg', desc: 'Antibiotic for urinary tract infections and certain types of diarrhea.', price: 110, cost: 65, rx: true },
        { name: 'Fluconazole 150mg', desc: 'Antifungal medication for yeast infections, oral thrush and cryptococcal meningitis.', price: 85, cost: 45, rx: true },
        { name: 'Fexofenadine 120mg', desc: 'Non-drowsy antihistamine for seasonal allergies and chronic urticaria.', price: 90, cost: 50, rx: false },
        { name: 'Metronidazole 400mg', desc: 'Antibiotic and antiprotozoal agent for anaerobic bacterial infections and parasitic diseases.', price: 60, cost: 32, rx: true },
        { name: 'Cefixime 200mg', desc: 'Third-generation cephalosporin antibiotic for respiratory, urinary and ear infections.', price: 165, cost: 100, rx: true },
        { name: 'Loratadine 10mg', desc: 'Long-acting non-drowsy antihistamine for allergy relief.', price: 38, cost: 18, rx: false },
        { name: 'Albendazole 400mg', desc: 'Anthelmintic for treating worm infestations including roundworm, hookworm and tapeworm.', price: 25, cost: 12, rx: false },
        { name: 'Atenolol 50mg', desc: 'Beta-blocker for treating high blood pressure, angina and irregular heartbeat.', price: 48, cost: 25, rx: true },
        { name: 'Amlodipine 5mg', desc: 'Calcium channel blocker for hypertension and angina management.', price: 55, cost: 28, rx: true },
        { name: 'Losartan 50mg', desc: 'Angiotensin receptor blocker for treating high blood pressure and protecting kidneys.', price: 70, cost: 38, rx: true },
        { name: 'Aspirin 75mg', desc: 'Low-dose aspirin for cardiovascular protection and blood thinning therapy.', price: 30, cost: 15, rx: false },
        { name: 'Chlorpheniramine 4mg', desc: 'First-generation antihistamine for cold, allergy and hay fever symptoms.', price: 20, cost: 10, rx: false },
    ],

    'Baby Care': [
        { name: 'Gripe Water 150ml', desc: 'Natural digestive supplement for relieving colic, gas and stomach discomfort in babies.', price: 95, cost: 55, rx: false },
        { name: 'Baby Vitamin D3 Drops', desc: 'Essential vitamin D3 supplement for bone development in infants. Provides 400 IU per drop.', price: 220, cost: 140, rx: false },
        { name: 'Baby Diaper Rash Cream', desc: 'Zinc oxide cream for preventing and treating diaper rash. Forms protective barrier on skin.', price: 185, cost: 110, rx: false },
        { name: 'Infant Paracetamol Drops', desc: 'Gentle fever reducer and pain reliever formulated specifically for infants aged 2-11 months.', price: 65, cost: 35, rx: false },
        { name: 'Baby Nasal Saline Drops', desc: 'Sterile saline solution for clearing nasal congestion in babies. Safe for daily use.', price: 75, cost: 40, rx: false },
        { name: 'Lactase Baby Drops', desc: 'Enzyme supplement to help babies digest lactose in breast milk or formula.', price: 350, cost: 220, rx: false },
        { name: 'Baby Probiotic Drops', desc: 'Lactobacillus reuteri probiotic drops for digestive health and immune support in infants.', price: 425, cost: 280, rx: false },
        { name: 'Calamine Baby Lotion', desc: 'Soothing lotion for baby skin irritation, heat rash and insect bites.', price: 120, cost: 70, rx: false },
        { name: 'Baby Oral Rehydration Salts', desc: 'WHO-approved ORS formula for treating dehydration from diarrhea in infants and children.', price: 35, cost: 18, rx: false },
        { name: 'Teething Gel for Babies', desc: 'Benzocaine-free teething gel for soothing gum pain during teething.', price: 145, cost: 85, rx: false },
        { name: 'Baby Cough Syrup', desc: 'Honey-based natural cough suppressant for children above 1 year. Soothes throat irritation.', price: 110, cost: 65, rx: false },
        { name: 'Baby Multivitamin Drops', desc: 'Complete multivitamin supplement with iron for babies aged 0-12 months.', price: 280, cost: 175, rx: false },
        { name: 'Eucalyptus Baby Rub', desc: 'Gentle vapor rub for relieving cold and congestion in babies. Menthol-free formula.', price: 135, cost: 80, rx: false },
        { name: 'Baby Iron Supplement', desc: 'Liquid iron supplement for preventing iron deficiency anemia in infants.', price: 195, cost: 120, rx: false },
        { name: 'Infant Gas Relief Drops', desc: 'Simethicone drops for quick relief from gas, bloating and colic in newborns.', price: 85, cost: 48, rx: false },
        { name: 'Baby Zinc Drops', desc: 'Zinc supplement for supporting immune function and growth in infants.', price: 165, cost: 100, rx: false },
        { name: 'Nappy Rash Powder', desc: 'Medicated baby powder with cornstarch for preventing diaper rash and moisture.', price: 95, cost: 55, rx: false },
        { name: 'Baby Ear Drops', desc: 'Gentle ear drops for treating ear infections and removing wax buildup in babies.', price: 110, cost: 65, rx: true },
        { name: 'Infant DHA Drops', desc: 'Omega-3 DHA supplement for brain and eye development in infants.', price: 380, cost: 240, rx: false },
        { name: 'Baby Saline Nebulizer Solution', desc: 'Sterile saline solution for nebulizer use in treating respiratory congestion in babies.', price: 55, cost: 30, rx: false },
        { name: 'Baby Calcium Supplement', desc: 'Liquid calcium with vitamin D for strong bones and teeth development in infants.', price: 245, cost: 155, rx: false },
        { name: 'Anti-Colic Baby Bottles', desc: 'BPA-free anti-colic feeding bottle with venting system to reduce air intake.', price: 450, cost: 280, rx: false },
        { name: 'Baby Digital Thermometer', desc: 'Fast-reading digital thermometer with flexible tip designed for infant use.', price: 320, cost: 195, rx: false },
        { name: 'Baby Moisturizing Cream', desc: 'Pediatrician-recommended moisturizer for sensitive baby skin. Fragrance-free formula.', price: 175, cost: 105, rx: false },
        { name: 'Baby Nose Aspirator', desc: 'Manual nasal aspirator for safely removing mucus from baby\'s nose during cold.', price: 250, cost: 150, rx: false },
    ],

    'Joint Care': [
        { name: 'Glucosamine 1500mg', desc: 'Joint health supplement for cartilage repair and reducing osteoarthritis symptoms.', price: 450, cost: 280, rx: false },
        { name: 'Chondroitin Sulfate 400mg', desc: 'Supports joint flexibility and cushioning. Often combined with glucosamine for best results.', price: 380, cost: 240, rx: false },
        { name: 'Calcium + Vitamin D3', desc: 'Bone health supplement combining calcium citrate with vitamin D3 for optimal absorption.', price: 295, cost: 180, rx: false },
        { name: 'Diclofenac Gel 30g', desc: 'Topical NSAID gel for localized joint pain, muscle aches and sports injuries.', price: 120, cost: 70, rx: false },
        { name: 'Collagen Peptides Powder', desc: 'Hydrolyzed collagen supplement for joint health, skin elasticity and bone strength.', price: 850, cost: 520, rx: false },
        { name: 'Methylsulfonylmethane (MSM)', desc: 'Organic sulfur compound for reducing joint inflammation and improving mobility.', price: 320, cost: 195, rx: false },
        { name: 'Omega-3 Fish Oil 1000mg', desc: 'High EPA/DHA fish oil for joint lubrication and reducing inflammatory conditions.', price: 485, cost: 300, rx: false },
        { name: 'Piroxicam 20mg', desc: 'NSAID for treating rheumatoid arthritis, osteoarthritis and acute musculoskeletal disorders.', price: 65, cost: 35, rx: true },
        { name: 'Etoricoxib 90mg', desc: 'COX-2 inhibitor for acute gouty arthritis and osteoarthritis pain management.', price: 145, cost: 85, rx: true },
        { name: 'Hyaluronic Acid Capsules', desc: 'Supports joint lubrication and cushioning with pharmaceutical-grade hyaluronic acid.', price: 550, cost: 340, rx: false },
        { name: 'Turmeric Curcumin 500mg', desc: 'Natural anti-inflammatory supplement with curcumin extract and black pepper for absorption.', price: 275, cost: 165, rx: false },
        { name: 'Boswellia Extract 250mg', desc: 'Herbal supplement for joint health derived from Boswellia serrata resin.', price: 310, cost: 190, rx: false },
        { name: 'Indomethacin 25mg', desc: 'Potent NSAID for severe joint inflammation, gout attacks and ankylosing spondylitis.', price: 55, cost: 30, rx: true },
        { name: 'Methyl Salicylate Spray', desc: 'Topical analgesic spray for instant joint and muscle pain relief.', price: 175, cost: 105, rx: false },
        { name: 'Vitamin K2 + D3 Capsules', desc: 'Synergistic bone health formula directing calcium to bones and away from arteries.', price: 395, cost: 245, rx: false },
        { name: 'Teriparatide Injection', desc: 'Parathyroid hormone analog for severe osteoporosis treatment. Stimulates new bone formation.', price: 3500, cost: 2200, rx: true },
        { name: 'Calcitonin Nasal Spray', desc: 'Salmon calcitonin for treating postmenopausal osteoporosis and reducing bone pain.', price: 1200, cost: 750, rx: true },
        { name: 'Knee Support Brace', desc: 'Adjustable compression knee brace for arthritis support and injury recovery.', price: 650, cost: 400, rx: false },
        { name: 'Hot/Cold Therapy Pack', desc: 'Reusable gel therapy pack for joint pain relief through heat or cold application.', price: 350, cost: 210, rx: false },
        { name: 'Aceclofenac 100mg', desc: 'NSAID for chronic joint pain, low-back pain and dental pain management.', price: 85, cost: 48, rx: true },
        { name: 'Diacerein 50mg', desc: 'Disease-modifying osteoarthritis drug that inhibits cartilage degradation.', price: 195, cost: 120, rx: true },
        { name: 'Calcium Carbonate 1250mg', desc: 'High-concentration calcium supplement for meeting daily calcium requirements.', price: 165, cost: 100, rx: false },
        { name: 'Rosehip Extract Capsules', desc: 'Natural supplement rich in galactolipids for reducing joint stiffness and pain.', price: 420, cost: 260, rx: false },
        { name: 'Keto Topical Spray', desc: 'Ketoprofen-based topical anti-inflammatory spray for localized musculoskeletal pain.', price: 220, cost: 135, rx: false },
        { name: 'Magnesium Citrate 400mg', desc: 'Bioavailable magnesium for muscle relaxation, bone health and cramp prevention.', price: 285, cost: 175, rx: false },
    ],

    'Pain Relief': [
        { name: 'Ibuprofen 400mg', desc: 'NSAID for relieving pain, inflammation and fever. Effective for headaches and muscle pain.', price: 35, cost: 18, rx: false },
        { name: 'Naproxen 250mg', desc: 'Long-acting NSAID for arthritis, menstrual cramps and general pain relief.', price: 55, cost: 30, rx: false },
        { name: 'Tramadol 50mg', desc: 'Moderate-strength opioid analgesic for managing moderate to severe pain.', price: 125, cost: 75, rx: true },
        { name: 'Diclofenac 50mg', desc: 'NSAID tablet for treating acute pain, including post-surgical and dental pain.', price: 45, cost: 24, rx: false },
        { name: 'Paracetamol + Caffeine', desc: 'Enhanced pain relief combination for tension headaches and migraine.', price: 50, cost: 28, rx: false },
        { name: 'Mefenamic Acid 500mg', desc: 'Fenamate NSAID for menstrual pain, dental pain and mild to moderate pain.', price: 40, cost: 22, rx: false },
        { name: 'Muscle Relaxant Cream 50g', desc: 'Topical cream combining methyl salicylate and menthol for muscle pain relief.', price: 95, cost: 55, rx: false },
        { name: 'Sumatriptan 50mg', desc: 'Selective serotonin receptor agonist for acute migraine treatment.', price: 180, cost: 110, rx: true },
        { name: 'Pregabalin 75mg', desc: 'Anticonvulsant for neuropathic pain, fibromyalgia and generalized anxiety.', price: 155, cost: 90, rx: true },
        { name: 'Gabapentin 300mg', desc: 'Anticonvulsant used for nerve pain, including postherpetic neuralgia.', price: 130, cost: 78, rx: true },
        { name: 'Capsaicin Cream 0.025%', desc: 'Natural pepper-derived topical analgesic for chronic pain and neuropathy.', price: 165, cost: 100, rx: false },
        { name: 'Lidocaine Patches 5%', desc: 'Topical anesthetic patches for localized pain relief up to 12 hours.', price: 350, cost: 215, rx: true },
        { name: 'Nimesulide 100mg', desc: 'Selective COX-2 inhibitor with potent analgesic and anti-inflammatory properties.', price: 42, cost: 22, rx: false },
        { name: 'Ketorolac 10mg', desc: 'Powerful NSAID for short-term management of moderately severe acute pain.', price: 85, cost: 48, rx: true },
        { name: 'Combiflam Tablets', desc: 'Combination of ibuprofen and paracetamol for enhanced pain and fever relief.', price: 38, cost: 20, rx: false },
        { name: 'Volini Pain Relief Spray', desc: 'Fast-acting topical pain relief spray with diclofenac. No mess application.', price: 210, cost: 130, rx: false },
        { name: 'Morphine Sulfate 10mg', desc: 'Strong opioid analgesic for severe pain management in clinical settings.', price: 95, cost: 55, rx: true },
        { name: 'Tapentadol 50mg', desc: 'Centrally-acting analgesic for moderate to severe acute and chronic pain.', price: 220, cost: 135, rx: true },
        { name: 'Flurbiprofen Lozenge', desc: 'Anti-inflammatory lozenge for sore throat pain and mouth ulcer relief.', price: 80, cost: 45, rx: false },
        { name: 'Tizanidine 2mg', desc: 'Muscle relaxant for treating spasticity and muscle spasm-related pain.', price: 65, cost: 35, rx: true },
        { name: 'Acetaminophen ER 650mg', desc: 'Extended-release paracetamol providing long-lasting pain relief up to 8 hours.', price: 75, cost: 42, rx: false },
        { name: 'Celecoxib 200mg', desc: 'COX-2 selective NSAID for osteoarthritis, rheumatoid arthritis and acute pain.', price: 160, cost: 95, rx: true },
        { name: 'Pain Relief Patches Pack', desc: 'Self-adhesive heat patches for back, neck and shoulder pain relief. Pack of 5.', price: 195, cost: 120, rx: false },
        { name: 'Eletriptan 40mg', desc: 'Second-generation triptan for acute migraine attacks with or without aura.', price: 245, cost: 150, rx: true },
        { name: 'Menthol Pain Balm 25g', desc: 'Ayurvedic pain balm with menthol and camphor for headache and body ache.', price: 60, cost: 32, rx: false },
    ],

    'Wellness': [
        { name: 'Multivitamin Daily Tablets', desc: 'Complete A to Z multivitamin formula with 23 essential vitamins and minerals.', price: 395, cost: 245, rx: false },
        { name: 'Vitamin C 1000mg', desc: 'High-potency vitamin C with rose hips for immunity support and antioxidant protection.', price: 280, cost: 170, rx: false },
        { name: 'Vitamin B12 1500mcg', desc: 'Methylcobalamin supplement for energy, nervous system health and red blood cell formation.', price: 320, cost: 195, rx: false },
        { name: 'Ashwagandha Extract 500mg', desc: 'Adaptogenic herb for stress reduction, energy enhancement and hormonal balance.', price: 350, cost: 215, rx: false },
        { name: 'Protein Powder Chocolate', desc: 'Whey protein isolate with 25g protein per serving for muscle recovery and strength.', price: 1250, cost: 780, rx: false },
        { name: 'Zinc 50mg Tablets', desc: 'Essential mineral supplement for immune function, wound healing and taste perception.', price: 145, cost: 85, rx: false },
        { name: 'Melatonin 3mg', desc: 'Natural sleep hormone supplement for regulating sleep-wake cycles and jet lag.', price: 230, cost: 140, rx: false },
        { name: 'Iron + Folic Acid', desc: 'Iron bisglycinate with folate for preventing iron deficiency anemia. Gentle on stomach.', price: 175, cost: 105, rx: false },
        { name: 'Biotin 10000mcg', desc: 'High-strength biotin for promoting healthy hair, skin and nail growth.', price: 295, cost: 180, rx: false },
        { name: 'CoQ10 100mg', desc: 'Coenzyme Q10 for heart health, cellular energy production and antioxidant support.', price: 485, cost: 300, rx: false },
        { name: 'Vitamin D3 60000 IU', desc: 'Weekly high-dose vitamin D3 supplement for deficiency treatment. Cholecalciferol form.', price: 165, cost: 100, rx: false },
        { name: 'Apple Cider Vinegar Caps', desc: 'Convenient capsule form of organic apple cider vinegar for weight management and digestion.', price: 380, cost: 235, rx: false },
        { name: 'Spirulina Tablets 500mg', desc: 'Organic spirulina superfood supplement rich in protein, vitamins and antioxidants.', price: 310, cost: 190, rx: false },
        { name: 'L-Arginine 1000mg', desc: 'Amino acid supplement for cardiovascular health, exercise performance and blood flow.', price: 420, cost: 260, rx: false },
        { name: 'Elderberry Gummies', desc: 'Delicious gummy supplement with sambucus elderberry extract for immune support.', price: 495, cost: 310, rx: false },
        { name: 'Tulsi Extract Drops', desc: 'Holy basil extract for respiratory health, stress relief and immunity enhancement.', price: 155, cost: 90, rx: false },
        { name: 'Flaxseed Oil Capsules', desc: 'Plant-based omega-3 supplement from organic flaxseed for heart and brain health.', price: 265, cost: 160, rx: false },
        { name: 'Shilajit Resin 20g', desc: 'Purified Himalayan shilajit for energy, stamina and overall vitality.', price: 750, cost: 465, rx: false },
        { name: 'Triphala Tablets', desc: 'Traditional Ayurvedic formula for digestive health and gentle detoxification.', price: 120, cost: 70, rx: false },
        { name: 'Moringa Capsules 500mg', desc: 'Nutrient-dense moringa leaf supplement packed with vitamins, minerals and antioxidants.', price: 245, cost: 150, rx: false },
        { name: 'Electrolyte Powder Sachets', desc: 'Rapid rehydration formula with balanced electrolytes for sports and illness recovery.', price: 185, cost: 110, rx: false },
        { name: 'Ginseng Extract 250mg', desc: 'Korean ginseng root extract for mental clarity, energy and stress adaptation.', price: 425, cost: 265, rx: false },
        { name: 'Wheatgrass Powder 100g', desc: 'Organic wheatgrass powder rich in chlorophyll for detoxification and alkalizing.', price: 295, cost: 180, rx: false },
        { name: 'Immunity Booster Kit', desc: 'Complete immunity support pack with vitamin C, zinc, and elderberry capsules.', price: 650, cost: 400, rx: false },
        { name: 'Selenium 200mcg', desc: 'Trace mineral supplement for thyroid function, antioxidant defense and immunity.', price: 210, cost: 128, rx: false },
    ],

    'Medical Equipment': [
        { name: 'Digital Blood Pressure Monitor', desc: 'Automatic upper arm BP monitor with large LCD display and irregular heartbeat detection.', price: 1850, cost: 1150, rx: false },
        { name: 'Glucometer Kit', desc: 'Blood glucose monitoring system with 25 test strips and lancets for diabetes management.', price: 950, cost: 580, rx: false },
        { name: 'Digital Thermometer', desc: 'Fast-response clinical thermometer with fever alarm and memory recall function.', price: 250, cost: 150, rx: false },
        { name: 'Pulse Oximeter', desc: 'Fingertip pulse oximeter for measuring blood oxygen saturation and pulse rate.', price: 850, cost: 520, rx: false },
        { name: 'Nebulizer Machine', desc: 'Compressor nebulizer for respiratory therapy. Converts liquid medicine into fine mist.', price: 1650, cost: 1020, rx: false },
        { name: 'Steam Inhaler Vaporizer', desc: 'Electric steam vaporizer for cold, cough and sinus relief with adjustable steam.', price: 550, cost: 340, rx: false },
        { name: 'Stethoscope Professional', desc: 'Dual-head stethoscope with adjustable chest piece for clinical auscultation.', price: 1200, cost: 740, rx: false },
        { name: 'Weighing Scale Digital', desc: 'Precision digital body weight scale with BMI calculator and tempered glass platform.', price: 1100, cost: 680, rx: false },
        { name: 'Glucometer Test Strips 50s', desc: 'Replacement test strips compatible with standard glucometers. Pack of 50.', price: 650, cost: 400, rx: false },
        { name: 'Blood Lancets 100s', desc: 'Ultra-thin sterile blood lancets for painless blood sampling. Pack of 100.', price: 180, cost: 110, rx: false },
        { name: 'Infrared Thermometer', desc: 'Non-contact infrared thermometer for instant forehead temperature reading.', price: 1350, cost: 835, rx: false },
        { name: 'N95 Face Masks 10s', desc: 'NIOSH-approved N95 particulate respirator masks for protection. Pack of 10.', price: 350, cost: 215, rx: false },
        { name: 'First Aid Kit Premium', desc: 'Comprehensive 75-piece first aid kit with antiseptics, bandages and emergency supplies.', price: 750, cost: 465, rx: false },
        { name: 'Cervical Pillow', desc: 'Ergonomic memory foam cervical pillow for neck pain relief and proper spinal alignment.', price: 1250, cost: 775, rx: false },
        { name: 'Heating Pad Electric', desc: 'Therapeutic heating pad with 3 heat settings for muscle pain and menstrual cramp relief.', price: 650, cost: 400, rx: false },
        { name: 'Compression Stockings', desc: 'Medical-grade graduated compression stockings for varicose veins and leg fatigue.', price: 550, cost: 340, rx: false },
        { name: 'Surgical Gloves 100s', desc: 'Powder-free nitrile examination gloves for medical and laboratory use. Pack of 100.', price: 450, cost: 280, rx: false },
        { name: 'Wheelchair Foldable', desc: 'Lightweight foldable wheelchair with cushioned seat and footrests. 100kg capacity.', price: 8500, cost: 5250, rx: false },
        { name: 'Walking Cane Adjustable', desc: 'Aluminum adjustable walking cane with ergonomic rubber grip and anti-slip tip.', price: 450, cost: 275, rx: false },
        { name: 'Finger Splint Set', desc: 'Adjustable aluminum finger splints for treating finger fractures and sprains. Set of 3.', price: 250, cost: 150, rx: false },
        { name: 'Arm Sling Support', desc: 'Breathable mesh arm sling for immobilizing injured arm, wrist or shoulder.', price: 320, cost: 195, rx: false },
        { name: 'Elastic Bandage Roll 3-inch', desc: 'Self-adhesive elastic compression bandage for sprains and strains.', price: 85, cost: 48, rx: false },
        { name: 'Hot Water Bottle 2L', desc: 'Natural rubber hot water bottle with soft cover for pain relief and warmth.', price: 350, cost: 215, rx: false },
        { name: 'Pill Organizer Weekly', desc: '7-day pill organizer with AM/PM compartments for medication management.', price: 195, cost: 120, rx: false },
        { name: 'Medical Mask Surgical 50s', desc: '3-ply disposable surgical face masks with ear loops. Pack of 50.', price: 250, cost: 155, rx: false },
    ],

    'Skin Care': [
        { name: 'Sunscreen SPF 50+ 50ml', desc: 'Broad-spectrum UVA/UVB sunscreen with matte finish. Water-resistant for 80 minutes.', price: 450, cost: 280, rx: false },
        { name: 'Hydrocortisone Cream 1%', desc: 'Topical corticosteroid for treating eczema, dermatitis and insect bite reactions.', price: 85, cost: 48, rx: false },
        { name: 'Benzoyl Peroxide Gel 5%', desc: 'Acne treatment gel that kills bacteria and reduces inflammation.', price: 120, cost: 70, rx: false },
        { name: 'Clotrimazole Cream 1%', desc: 'Antifungal cream for treating ringworm, athlete\'s foot and fungal skin infections.', price: 75, cost: 42, rx: false },
        { name: 'Adapalene Gel 0.1%', desc: 'Retinoid gel for treating acne by normalizing skin cell turnover and reducing inflammation.', price: 280, cost: 170, rx: true },
        { name: 'Glycolic Acid Serum 10%', desc: 'AHA exfoliating serum for treating dark spots, fine lines and uneven skin tone.', price: 520, cost: 320, rx: false },
        { name: 'Salicylic Acid Face Wash', desc: '2% salicylic acid cleanser for oily and acne-prone skin. Unclogs pores effectively.', price: 295, cost: 180, rx: false },
        { name: 'Mupirocin Ointment 2%', desc: 'Topical antibiotic for treating impetigo and skin infections caused by staphylococcus.', price: 135, cost: 80, rx: true },
        { name: 'Tretinoin Cream 0.025%', desc: 'Prescription retinoid for treating acne, photoaging and hyperpigmentation.', price: 350, cost: 215, rx: true },
        { name: 'Moisturizing Cream Ceramide', desc: 'Ceramide-enriched moisturizer for restoring skin barrier and treating dry skin.', price: 395, cost: 245, rx: false },
        { name: 'Niacinamide Serum 10%', desc: 'Vitamin B3 serum for reducing pores, brightening skin and controlling oil production.', price: 425, cost: 265, rx: false },
        { name: 'Ketoconazole Cream 2%', desc: 'Antifungal cream for treating seborrheic dermatitis, dandruff and fungal infections.', price: 95, cost: 55, rx: true },
        { name: 'Vitamin C Serum 20%', desc: 'L-ascorbic acid serum for brightening, collagen synthesis and sun damage repair.', price: 550, cost: 340, rx: false },
        { name: 'Calamine Lotion 100ml', desc: 'Soothing lotion for sunburn, chickenpox, insect bites and mild skin irritation.', price: 65, cost: 35, rx: false },
        { name: 'Azelaic Acid Gel 15%', desc: 'Gel for acne and rosacea treatment with antibacterial and anti-inflammatory properties.', price: 310, cost: 190, rx: true },
        { name: 'Hyaluronic Acid Serum', desc: 'Pure hyaluronic acid face serum for deep hydration and plumping fine lines.', price: 480, cost: 295, rx: false },
        { name: 'Antifungal Powder 75g', desc: 'Clotrimazole dusting powder for preventing fungal infections in skin folds.', price: 110, cost: 65, rx: false },
        { name: 'Lip Balm Medicated SPF 15', desc: 'Medicated lip balm with SPF protection for dry, cracked and chapped lips.', price: 85, cost: 48, rx: false },
        { name: 'Acne Pimple Patches', desc: 'Hydrocolloid patches for absorbing pus and healing acne overnight. Pack of 24.', price: 195, cost: 120, rx: false },
        { name: 'Betamethasone Cream 0.1%', desc: 'Potent steroid cream for severe eczema, psoriasis and inflammatory skin conditions.', price: 65, cost: 35, rx: true },
        { name: 'Permethrin Cream 5%', desc: 'Topical treatment for scabies infestation. Single application kills mites and eggs.', price: 120, cost: 70, rx: true },
        { name: 'Miconazole Cream 2%', desc: 'Broad-spectrum antifungal cream for candidiasis and dermatophyte skin infections.', price: 85, cost: 48, rx: false },
        { name: 'Retinol Night Cream', desc: 'Anti-aging night cream with 0.5% retinol for reducing wrinkles and improving texture.', price: 650, cost: 400, rx: false },
        { name: 'Aloe Vera Gel Pure', desc: '99% pure aloe vera gel for soothing sunburn, moisturizing and minor wound healing.', price: 175, cost: 105, rx: false },
        { name: 'Silver Sulfadiazine Cream', desc: 'Topical antimicrobial for burn treatment preventing and treating wound infections.', price: 95, cost: 55, rx: true },
    ],

    'Digestive Health': [
        { name: 'Antacid Tablets Mint', desc: 'Calcium carbonate chewable tablets for rapid relief from heartburn and acid indigestion.', price: 55, cost: 30, rx: false },
        { name: 'Probiotic Capsules', desc: 'Multi-strain probiotic with 10 billion CFU for digestive balance and immune support.', price: 385, cost: 240, rx: false },
        { name: 'Isabgol Husk Powder 200g', desc: 'Natural psyllium husk fiber supplement for constipation relief and digestive regularity.', price: 120, cost: 70, rx: false },
        { name: 'Digestive Enzyme Complex', desc: 'Broad-spectrum enzyme supplement with protease, lipase and amylase for better digestion.', price: 295, cost: 180, rx: false },
        { name: 'Lactulose Solution 200ml', desc: 'Osmotic laxative for treating chronic constipation and hepatic encephalopathy.', price: 135, cost: 80, rx: false },
        { name: 'Ondansetron 4mg', desc: 'Anti-emetic for preventing nausea and vomiting caused by chemotherapy and surgery.', price: 65, cost: 35, rx: true },
        { name: 'Podina Pudina Capsules', desc: 'Peppermint oil capsules for treating IBS symptoms, bloating and abdominal pain.', price: 195, cost: 120, rx: false },
        { name: 'Sucralfate 1g', desc: 'Mucosal protectant for treating peptic ulcers by coating the stomach lining.', price: 85, cost: 48, rx: true },
        { name: 'Lansoprazole 30mg', desc: 'Proton pump inhibitor for treating GERD and duodenal ulcers.', price: 95, cost: 55, rx: true },
        { name: 'Eno Antacid Sachets 30s', desc: 'Effervescent antacid powder for quick relief from acidity. Lemon flavor.', price: 110, cost: 65, rx: false },
        { name: 'Prebiotic Fiber Gummies', desc: 'Prebiotic chicory root fiber gummies for promoting gut microbiome health.', price: 350, cost: 215, rx: false },
        { name: 'Senna Tablets 7.5mg', desc: 'Natural herbal laxative for occasional constipation. Gentle overnight relief.', price: 45, cost: 24, rx: false },
        { name: 'Aluminum Hydroxide Gel', desc: 'Antacid gel for neutralizing stomach acid and providing relief from peptic ulcer pain.', price: 65, cost: 35, rx: false },
        { name: 'Esomeprazole 40mg', desc: 'Next-generation PPI for treating erosive esophagitis and GERD symptoms.', price: 125, cost: 75, rx: true },
        { name: 'Ursodeoxycholic Acid 300mg', desc: 'Bile acid for dissolving gallstones and treating primary biliary cholangitis.', price: 180, cost: 110, rx: true },
        { name: 'Bismuth Subsalicylate', desc: 'Relief from diarrhea, nausea, heartburn, upset stomach and indigestion.', price: 95, cost: 55, rx: false },
        { name: 'Activated Charcoal Capsules', desc: 'Adsorptive agent for food poisoning, bloating and gas relief. 250mg capsules.', price: 210, cost: 128, rx: false },
        { name: 'Rabeprazole 20mg', desc: 'PPI for treating duodenal ulcers, GERD and pathological hypersecretory conditions.', price: 85, cost: 48, rx: true },
        { name: 'Dicyclomine 20mg', desc: 'Antispasmodic for treating irritable bowel syndrome and intestinal cramps.', price: 55, cost: 30, rx: true },
        { name: 'Loperamide 2mg', desc: 'Anti-diarrheal medication for acute and chronic diarrhea management.', price: 35, cost: 18, rx: false },
        { name: 'Glutamine Powder 300g', desc: 'L-glutamine amino acid supplement for gut lining repair and digestive health.', price: 550, cost: 340, rx: false },
        { name: 'Milk of Magnesia 200ml', desc: 'Magnesium hydroxide suspension for constipation relief and acid neutralization.', price: 75, cost: 42, rx: false },
        { name: 'Mesalamine 400mg', desc: 'Anti-inflammatory for treating ulcerative colitis and Crohn\'s disease.', price: 285, cost: 175, rx: true },
        { name: 'Pancreatin Enzyme Capsules', desc: 'Pancreatic enzyme replacement for exocrine pancreatic insufficiency.', price: 320, cost: 195, rx: true },
        { name: 'Aloe Vera Juice 500ml', desc: 'Organic aloe vera juice for digestive soothing and promoting gut health.', price: 195, cost: 120, rx: false },
    ],

    'Eye & Ear Care': [
        { name: 'Lubricant Eye Drops 10ml', desc: 'Preservative-free artificial tears for dry eye relief. Soothes irritation and redness.', price: 195, cost: 120, rx: false },
        { name: 'Ciprofloxacin Eye Drops', desc: 'Antibiotic eye drops for treating bacterial conjunctivitis and corneal ulcers.', price: 85, cost: 48, rx: true },
        { name: 'Ofloxacin Ear Drops', desc: 'Fluoroquinolone ear drops for treating swimmer\'s ear and chronic otitis media.', price: 75, cost: 42, rx: true },
        { name: 'Contact Lens Solution 360ml', desc: 'Multi-purpose solution for cleaning, disinfecting and storing soft contact lenses.', price: 350, cost: 215, rx: false },
        { name: 'Tobramycin Eye Drops 0.3%', desc: 'Aminoglycoside antibiotic eye drops for external bacterial eye infections.', price: 110, cost: 65, rx: true },
        { name: 'Wax Removal Ear Drops', desc: 'Gentle ear drops for softening and removing earwax buildup safely.', price: 95, cost: 55, rx: false },
        { name: 'Anti-Allergy Eye Drops', desc: 'Olopatadine eye drops for relieving itchy, watery eyes from seasonal allergies.', price: 165, cost: 100, rx: false },
        { name: 'Fluorometholone Eye Drops', desc: 'Corticosteroid eye drops for treating eye inflammation and allergic conditions.', price: 120, cost: 70, rx: true },
        { name: 'Prednisolone Eye Drops 1%', desc: 'Anti-inflammatory steroid eye drops for post-surgical inflammation and uveitis.', price: 95, cost: 55, rx: true },
        { name: 'Timolol Eye Drops 0.5%', desc: 'Beta-blocker eye drops for reducing intraocular pressure in open-angle glaucoma.', price: 85, cost: 48, rx: true },
        { name: 'Eye Wash Cup Solution', desc: 'Sterile boric acid eye wash for flushing out irritants, dust and debris.', price: 125, cost: 75, rx: false },
        { name: 'Moxifloxacin Eye Drops', desc: 'Fourth-generation fluoroquinolone eye drops for bacterial conjunctivitis treatment.', price: 135, cost: 80, rx: true },
        { name: 'Neomycin Ear Drops', desc: 'Aminoglycoside antibiotic ear drops for external ear infections.', price: 65, cost: 35, rx: true },
        { name: 'Digital Hearing Aid Battery', desc: 'Long-lasting zinc-air hearing aid batteries size 312. Pack of 6.', price: 250, cost: 155, rx: false },
        { name: 'Eye Vitamin Capsules', desc: 'AREDS2 formula with lutein, zeaxanthin for age-related macular degeneration prevention.', price: 450, cost: 280, rx: false },
        { name: 'Atropine Eye Drops 1%', desc: 'Mydriatic eye drops for pupil dilation during eye examinations.', price: 55, cost: 30, rx: true },
        { name: 'Carboxymethylcellulose Drops', desc: 'High-viscosity artificial tears for severe dry eye and post-LASIK comfort.', price: 225, cost: 138, rx: false },
        { name: 'Latanoprost Eye Drops', desc: 'Prostaglandin analog for reducing elevated eye pressure in glaucoma patients.', price: 320, cost: 195, rx: true },
        { name: 'Ear Plugs Silicone 3-Pack', desc: 'Reusable silicone ear plugs for swimming, sleeping and noise reduction.', price: 145, cost: 85, rx: false },
        { name: 'Gentamicin Eye Ointment', desc: 'Broad-spectrum antibiotic ointment for bacterial eye infections and blepharitis.', price: 75, cost: 42, rx: true },
        { name: 'Blue Light Filter Glasses', desc: 'Computer glasses with blue light filtering lenses for digital eye strain prevention.', price: 550, cost: 340, rx: false },
        { name: 'Brimonidine Eye Drops 0.2%', desc: 'Alpha-agonist eye drops for glaucoma treatment by reducing aqueous humor production.', price: 185, cost: 110, rx: true },
        { name: 'Eye Patch Adhesive 20s', desc: 'Hypoallergenic adhesive eye patches for amblyopia treatment. Pack of 20.', price: 175, cost: 105, rx: false },
        { name: 'Chloramphenicol Eye Drops', desc: 'Broad-spectrum antibiotic eye drops for bacterial conjunctivitis. Preservative free.', price: 55, cost: 30, rx: true },
        { name: 'Ear Bulb Syringe', desc: 'Soft rubber ear syringe for gentle irrigation and wax removal at home.', price: 95, cost: 55, rx: false },
    ],

    'Respiratory Care': [
        { name: 'Salbutamol Inhaler 100mcg', desc: 'Quick-relief bronchodilator inhaler for acute asthma attacks and exercise-induced bronchospasm.', price: 135, cost: 80, rx: true },
        { name: 'Beclomethasone Inhaler', desc: 'Corticosteroid inhaler for long-term asthma control and prevention of symptoms.', price: 295, cost: 180, rx: true },
        { name: 'Cough Syrup Honey Lemon', desc: 'Dextromethorphan-based cough suppressant with honey and lemon flavor. Non-drowsy formula.', price: 110, cost: 65, rx: false },
        { name: 'Nasal Spray Saline 20ml', desc: 'Isotonic saline nasal spray for moisturizing dry nasal passages and clearing congestion.', price: 85, cost: 48, rx: false },
        { name: 'Xylometazoline Nasal Drops', desc: 'Decongestant nasal drops for quick relief from nasal congestion and sinusitis.', price: 55, cost: 30, rx: false },
        { name: 'Fluticasone Nasal Spray', desc: 'Steroid nasal spray for treating allergic rhinitis and nasal polyps. Once-daily dosing.', price: 265, cost: 160, rx: true },
        { name: 'Montelukast Chewable 5mg', desc: 'Pediatric chewable leukotriene antagonist for asthma prevention in children.', price: 120, cost: 70, rx: true },
        { name: 'Guaifenesin Syrup 200ml', desc: 'Expectorant syrup for productive cough. Thins and loosens chest mucus.', price: 95, cost: 55, rx: false },
        { name: 'Ambroxol Syrup 100ml', desc: 'Mucolytic agent for acute and chronic bronchopulmonary disorders. Reduces mucus viscosity.', price: 75, cost: 42, rx: false },
        { name: 'Ipratropium Inhaler', desc: 'Anticholinergic bronchodilator for COPD maintenance therapy.', price: 185, cost: 110, rx: true },
        { name: 'Steam Inhalation Capsules', desc: 'Menthol and eucalyptus capsules for steam inhalation during cold and sinus congestion.', price: 65, cost: 35, rx: false },
        { name: 'Budesonide Respules', desc: 'Nebulizer suspension for treating asthma and croup in children and adults.', price: 345, cost: 215, rx: true },
        { name: 'Throat Lozenges Menthol 20s', desc: 'Antiseptic throat lozenges with menthol for sore throat and cough relief.', price: 55, cost: 30, rx: false },
        { name: 'Oxymetazoline Nasal Spray', desc: 'Long-acting decongestant spray providing 12-hour nasal congestion relief.', price: 95, cost: 55, rx: false },
        { name: 'Salmeterol Inhaler 25mcg', desc: 'Long-acting beta-agonist inhaler for maintenance asthma and COPD therapy.', price: 320, cost: 195, rx: true },
        { name: 'Bromhexine Tablets 8mg', desc: 'Mucolytic agent for productive cough associated with respiratory tract conditions.', price: 35, cost: 18, rx: false },
        { name: 'Dextromethorphan Syrup', desc: 'Non-narcotic cough suppressant for dry, non-productive cough relief.', price: 85, cost: 48, rx: false },
        { name: 'Deriphyllin Tablets', desc: 'Bronchodilator combination of theophylline and etofylline for asthma and chronic bronchitis.', price: 45, cost: 24, rx: true },
        { name: 'Levosalbutamol Inhaler', desc: 'R-isomer of salbutamol for more targeted bronchodilation with fewer side effects.', price: 165, cost: 100, rx: true },
        { name: 'Antihistamine Cold Tablets', desc: 'Combination of paracetamol, phenylephrine and chlorpheniramine for cold and flu symptoms.', price: 40, cost: 22, rx: false },
        { name: 'Eucalyptus Oil 15ml', desc: 'Pure eucalyptus essential oil for steam inhalation and chest rub during congestion.', price: 120, cost: 70, rx: false },
        { name: 'Formoterol Inhaler 12mcg', desc: 'Long-acting beta-2 agonist for twice-daily COPD and asthma maintenance.', price: 285, cost: 175, rx: true },
        { name: 'Tulsi Cough Syrup 100ml', desc: 'Ayurvedic cough syrup with tulsi, honey and ginger for natural respiratory relief.', price: 95, cost: 55, rx: false },
        { name: 'Nebulizer Masks Pack', desc: 'Replacement nebulizer kit with adult and child masks, tubing and mouthpiece.', price: 250, cost: 155, rx: false },
        { name: 'Acetylcysteine 600mg', desc: 'Mucolytic supplement for chronic bronchitis and COPD. Also an antioxidant.', price: 175, cost: 105, rx: false },
    ],
};

// ─── MAIN SEED FUNCTION ─────────────────────────────────────

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear all collections
        console.log('🗑  Clearing all data...');
        await Promise.all([
            Category.deleteMany({}),
            Product.deleteMany({}),
            Inventory.deleteMany({}),
            Cart.deleteMany({}),
            Order.deleteMany({}),
            Prescription.deleteMany({}),
            Notification.deleteMany({}),
        ]);
        console.log('✅ All collections cleared');

        // Create admin user
        console.log('👤 Creating admin user...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        await User.deleteMany({ email: 'mpdsalem@gmail.com' });
        await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'mpdsalem@gmail.com',
            passwordHash,
            phone: '9999999999',
            role: 'admin',
        });
        console.log('✅ Admin user created (mpdsalem@gmail.com / admin123)');

        // Create categories
        console.log('📁 Creating categories...');
        const createdCategories = {};
        for (const catData of categoriesData) {
            const cat = await Category.create({
                name: catData.name,
                description: catData.description,
                imageUrl: randomImg(),
                isActive: true,
            });
            createdCategories[catData.name] = cat._id;
            console.log(`   ✓ ${catData.name}`);
        }
        console.log(`✅ ${Object.keys(createdCategories).length} categories created`);

        // Create products + inventory
        console.log('💊 Creating products...');
        let totalProducts = 0;
        let skuCounter = 1;

        for (const [categoryName, products] of Object.entries(productsMap)) {
            const categoryId = createdCategories[categoryName];
            for (const p of products) {
                const mfr = manufacturers[Math.floor(Math.random() * manufacturers.length)];
                const isFeatured = Math.random() < 0.15;
                const sku = `MED-${String(skuCounter++).padStart(4, '0')}`;
                const stockQty = Math.floor(Math.random() * 200) + 20;

                const product = await Product.create({
                    name: p.name,
                    description: p.desc,
                    sku,
                    category: categoryId,
                    manufacturer: mfr,
                    requiresPrescription: p.rx,
                    hsnCode: 3004,
                    gstRate: 12,
                    price: p.price,
                    costPrice: p.cost,
                    imageUrl: randomImg(),
                    isFeatured,
                    isActive: true,
                    stock: stockQty,
                });

                // Create inventory entry
                await Inventory.create({
                    product: product._id,
                    batchNumber: `BATCH-${Date.now()}-${skuCounter}`,
                    quantityInStock: stockQty,
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 + Math.random() * 365 * 24 * 60 * 60 * 1000),
                    costPrice: p.cost,
                    sellingPrice: p.price,
                    isAvailable: true,
                });

                totalProducts++;
            }
            console.log(`   ✓ ${categoryName}: ${products.length} products`);
        }

        console.log(`\n🎉 Seeding complete!`);
        console.log(`   Categories: ${Object.keys(createdCategories).length}`);
        console.log(`   Products:   ${totalProducts}`);
        console.log(`   Inventory:  ${totalProducts} entries`);
    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

seed();
