'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Loader2, BarChart2, Users } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { fetchAnalyticsData } from '../services/api';
import Header from '../components/Header';
import LoginModal from '../components/LoginModal';
import OtpModal from '../components/OtpModal';
import PieChartCard from '../components/PieChartCard';
import DataTable from '../components/DataTable';
import BarChartCard from '../components/BarChartCard';
import LineChartCard from '../components/LineChartCard';
import RadarChartCard from '../components/RadarChartCard';
import Toolbar, { DashboardView } from '../components/Toolbar';

interface TransformedMetrics {
  answer: string;
  count: number;
  percentage: number;
}

export default function AnalyticsDashboard() {
  const { isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView>('all');
  const [chartData, setChartData] = useState<TransformedMetrics[]>([]);
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [qOrder, setQOrder] = useState<string>('0');
  const [uniqueVoters, setUniqueVoters] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initMetrics() {
      try {
        setLoading(true);
        const displayPayload = await fetchAnalyticsData();
        
        if (displayPayload?.success && displayPayload?.poll) {
          const pollObj = displayPayload.poll;
          const voteResults = pollObj.voteresults || {};
          const totalCount = voteResults.responses_count || 0;
          const rawVotesArray = voteResults.v || [];

          setQOrder(pollObj.qorder || '0');
          setPollQuestion(pollObj.question || '');
          setTotalResponses(totalCount);
          setUniqueVoters(voteResults.votercount || 0);

          const cleanTransformedRows = rawVotesArray.map((item: any) => ({
            answer: item.vote || 'Unassigned Options',
            count: Number(item.count || 0),
            percentage: totalCount > 0 ? parseFloat(((item.count / totalCount) * 100).toFixed(1)) : 0
          }));

          setChartData(cleanTransformedRows);
        } else {
          throw new Error('Invalid telemetry schema object returned from endpoint.');
        }
      } catch (err: any) {
        setError(err.message || 'Error occurred initializing remote data analytics streams.');
      } finally {
        setLoading(false);
      }
    }
    initMetrics();
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-200">
      <Header />

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto relative glass border border-white/10 p-6 rounded-2xl shadow-[0_20px_80px_-20px_rgba(160,212,5,0.1)] transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] aurora-seam" />

          {/* Configuration Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="relative w-6 h-6 rounded-full p-[1.5px] aurora-seam shrink-0">
                <div className="flex items-center justify-center w-full h-full rounded-full bg-void-2 text-[11px] font-bold text-ink font-mono">
                  {qOrder}
                </div>
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-ink tracking-tight">{pollQuestion}</h2>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3 text-neon-teal" /> Responses: <strong className="text-ink">{totalResponses}</strong></span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-neon-lime" /> Voters: <strong className="text-ink">{uniqueVoters}</strong></span>
                </div>
              </div>
            </div>

            {/* Privilege Control Action Button */}
            {isAuthenticated && (
              <button
                onClick={() => alert('Layout designer interface workspace initialized.')}
                className="group relative rounded-lg p-[1px] aurora-seam shadow-[0_0_25px_-8px_rgba(160,212,5,0.4)] hover:shadow-[0_0_35px_-6px_rgba(44,158,75,0.5)] active:scale-95 transition"
              >
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-void-2/90 group-hover:bg-void-2/70 rounded-[7px] text-xs font-semibold text-ink transition">
                  <Edit3 className="w-3.5 h-3.5 text-neon-lime" /> Edit Layout
                </span>
              </button>
            )}
          </div>

          {/* Interactive Core Metrics Shell Container Matrix */}
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-neon-lime" />
              <p className="text-xs text-ink-muted font-mono">Synchronizing workspace analytical records...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="bg-red-500/10 text-red-400 text-xs p-4 rounded-xl border border-red-500/20 max-w-md text-center">
                <p className="font-semibold mb-1">Data Stream Connection Exception</p>
                <p className="opacity-80">{error}</p>
              </div>
            </div>
          ) : (
            /* Standardized 3-Column Base Grid System */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start min-h-[250px]">
              
              {/* Pie View Segment — Visible during Reset (all) and explicit filtering */}
              {(activeView === 'all' || activeView === 'pie') && (
                <div className="w-full glass border border-white/10 p-4 rounded-xl hover:shadow-[0_0_35px_-12px_rgba(163,212,5,0.15)] transition duration-200">
                  <PieChartCard data={chartData} />
                </div>
              )}

              {/* Bar View Segment — Visible during Reset (all) and explicit filtering */}
              {(activeView === 'all' || activeView === 'bar') && (
                <div className="w-full glass border border-white/10 p-4 rounded-xl hover:shadow-[0_0_35px_-12px_rgba(44,158,75,0.15)] transition duration-200">
                  <BarChartCard data={chartData} />
                </div>
              )}

              {/* Line View Segment — Hidden on Reset, only renders when explicitly selected */}
              {activeView === 'line' && (
                <div className="w-full glass border border-white/10 p-4 rounded-xl hover:shadow-[0_0_35px_-12px_rgba(163,212,5,0.15)] transition duration-200">
                  <LineChartCard data={chartData} />
                </div>
              )}

              {/* Radar View Segment — Hidden on Reset, only renders when explicitly selected */}
              {activeView === 'radar' && (
                <div className="w-full glass border border-white/10 p-4 rounded-xl hover:shadow-[0_0_35px_-12px_rgba(18,179,168,0.15)] transition duration-200">
                  <RadarChartCard data={chartData} />
                </div>
              )}

              {/* Data Table Section — Spans beautifully based on active view state filter configuration */}
              <div className={`w-full glass border border-white/10 p-4 rounded-xl ${
                activeView !== 'all' ? 'lg:col-span-2' : 'w-full'
              }`}>
                <DataTable data={chartData} />
              </div>

            </div>
          )}

          <Toolbar onViewChange={setActiveView} currentView={activeView} data={chartData} />
        </div>
      </main>

      <LoginModal />
      <OtpModal />
    </div>
  );
}