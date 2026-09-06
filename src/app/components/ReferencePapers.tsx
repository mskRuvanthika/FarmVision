import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Search, Download, ExternalLink, BookOpen } from 'lucide-react';

const CATEGORIES = [
  'All',
  'AI in Agriculture',
  'Crop Disease',
  'Soil',
  'Irrigation',
  'Weather',
  'Smart Farming',
  'Agricultural Technology',
];

const CATEGORY_STYLES: Record<string, { pill: string; dot: string }> = {
  'AI in Agriculture':       { pill: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  'Crop Disease':            { pill: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  'Soil':                    { pill: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  'Irrigation':              { pill: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  'Weather':                 { pill: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-500' },
  'Smart Farming':           { pill: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  'Agricultural Technology': { pill: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
};

const PAPERS = [
  {
    title: 'Deep Learning for Crop Disease Detection using Convolutional Neural Networks',
    desc: 'Comprehensive study using CNN-based models to detect 38 classes of plant diseases from leaf images with 96.3% accuracy on the PlantVillage dataset.',
    category: 'Crop Disease',
    year: 2023,
    journal: 'Journal of Agricultural Informatics',
  },
  {
    title: 'Precision Irrigation using IoT Sensors and Machine Learning Algorithms',
    desc: 'Smart irrigation system combining soil moisture sensors and ML-based evapotranspiration predictions to reduce water usage by 35% without yield loss.',
    category: 'Irrigation',
    year: 2024,
    journal: 'Computers and Electronics in Agriculture',
  },
  {
    title: 'Soil Health Monitoring with Hyperspectral Imaging and AI Analysis',
    desc: 'Novel approach using hyperspectral imagery and deep learning to predict soil NPK levels, pH, and organic matter non-destructively across field conditions.',
    category: 'Soil',
    year: 2023,
    journal: 'Geoderma',
  },
  {
    title: 'AI-Powered Crop Advisory Systems for Smallholder Farmers in India',
    desc: 'Field trials of an AI advisory platform covering 12,000 smallholder farms showing 23% yield improvement and 18% cost reduction over two growing seasons.',
    category: 'AI in Agriculture',
    year: 2024,
    journal: 'Nature Food',
  },
  {
    title: 'Climate-Smart Agriculture: Adapting Crop Calendars to Shifting Weather Patterns',
    desc: 'Dynamic crop calendar optimization using ensemble weather forecasting models and historical yield data covering three Indian states over 10 years.',
    category: 'Weather',
    year: 2022,
    journal: 'Global Food Security',
  },
  {
    title: 'Blockchain-Based Agricultural Supply Chain Transparency Framework',
    desc: 'Distributed ledger technology for tracking produce from farm to consumer, reducing post-harvest fraud and improving price discovery for smallholders.',
    category: 'Agricultural Technology',
    year: 2023,
    journal: 'Technological Forecasting and Social Change',
  },
  {
    title: 'Drone-Based Multispectral Imaging for Early Pest and Disease Detection',
    desc: 'UAV-mounted multispectral cameras combined with NDVI analysis detect crop stress 7–10 days before visible symptoms appear, enabling timely intervention.',
    category: 'Smart Farming',
    year: 2024,
    journal: 'Remote Sensing',
  },
  {
    title: 'Transfer Learning for Low-Resource Crop Disease Identification',
    desc: 'Fine-tuning pre-trained ResNet and EfficientNet models with small regional crop disease datasets from Karnataka and Maharashtra with 91% accuracy.',
    category: 'AI in Agriculture',
    year: 2023,
    journal: 'Expert Systems with Applications',
  },
  {
    title: 'Soil Carbon Sequestration under Conservation Agriculture Practices',
    desc: '15-year longitudinal study measuring soil organic carbon under zero-tillage, mulching, and cover cropping across wheat-rice rotational systems.',
    category: 'Soil',
    year: 2022,
    journal: 'Agriculture, Ecosystems & Environment',
  },
  {
    title: 'Predictive Modelling of Rice Blast Disease Using Weather Variables',
    desc: 'Statistical models correlating temperature, humidity, and leaf wetness with Magnaporthe oryzae outbreaks for advance disease forecasting and early warning.',
    category: 'Crop Disease',
    year: 2023,
    journal: 'Plant Pathology',
  },
  {
    title: 'Smart Drip Irrigation Scheduling with Evapotranspiration-Based Algorithms',
    desc: 'Automated irrigation scheduling using FAO Penman-Monteith ET₀ integrated with real-time weather station data for seven major vegetable crops.',
    category: 'Irrigation',
    year: 2024,
    journal: 'Agricultural Water Management',
  },
  {
    title: 'Voice-Based AI Interfaces for Multilingual Agricultural Advisory Services',
    desc: 'Design and evaluation of NLP-powered voice assistants supporting Hindi, Tamil, and Telugu for last-mile agricultural extension services in rural India.',
    category: 'Smart Farming',
    year: 2024,
    journal: 'Information Technology for Development',
  },
];

export function ReferencePapers() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = PAPERS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-white hover:text-green-200 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">📚 Research & Reference Papers</h1>
            <p className="text-sm text-green-100">Explore agriculture research, technology and farming knowledge</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-24">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, topic, or keyword..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-400 mb-4 font-medium">
          {filtered.length} paper{filtered.length !== 1 ? 's' : ''} found
          {activeCategory !== 'All' && ` in "${activeCategory}"`}
        </p>

        {/* Paper cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold mb-1">No papers found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((paper, i) => {
              const style = CATEGORY_STYLES[paper.category] ?? { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.pill}`}>
                      {paper.category}
                    </span>
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">{paper.year}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 leading-snug text-sm">{paper.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 leading-relaxed">{paper.desc}</p>
                  <p className="text-xs text-gray-400 italic mb-4 border-l-2 border-gray-100 pl-2">{paper.journal}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {}}
                      className="flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all flex-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Paper
                    </button>
                    <button
                      onClick={() => {}}
                      className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all flex-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
