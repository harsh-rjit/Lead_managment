import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Card } from '../components/common/Card';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="py-16 text-center max-w-md mx-auto px-4">
      <Card className="p-8 space-y-4">
        <div className="text-6xl font-black text-indigo-600 tracking-tight font-mono">404</div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Page Not Found</h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
          The page or resource you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button
              variant="primary"
              size="sm"
              icon={Home}
            >
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
