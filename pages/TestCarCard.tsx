

import * as React from 'react';
import CarCard from '../components/CarCard';
import { MOCK_CARS } from '../services/mockData';
import SEOMetadata from '../components/SEOMetadata';

const TestCarCard: React.FC = () => {
  // Use a fixed number of days and a start date for consistent pricing display
  const testDays = 3;
  const testStartDate = new Date().toISOString().split('T')[0];
  const testEndDate = new Date(new Date().setDate(new Date().getDate() + testDays)).toISOString().split('T')[0];

  return (
    <>
      <SEOMetadata
        title="Car Card Test Page"
        description="A page for testing the visual appearance of the CarCard component."
        noIndex={true}
      />
      <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Car Card Component Test</h1>
          <p className="text-slate-500 text-sm mb-8 text-center">
            This page displays all available car cards from the mock data to test their appearance.
          </p>
          
          <div className="flex flex-col items-center">
            {MOCK_CARS.map(car => (
              <CarCard 
                key={car.id}
                car={car}
                // FIX: Added missing props to satisfy CarCardProps interface
                cars={MOCK_CARS}
                days={testDays}
                startDate={testStartDate}
                endDate={testEndDate}
                pickupCode="LAX"
                dropoffCode="LAX"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TestCarCard;