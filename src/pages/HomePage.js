import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Rocket, GitBranch, Zap, Server, 
  ArrowRight, Layers, Cloud, Code2 
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const projectTypes = [
    {
      id: 'monorepo',
      title: 'Mono-Repo',
      subtitle: 'Microservices Architecture',
      description: 'Build a multi-service application with shared configuration and dependencies',
      icon: GitBranch,
      features: [
        'Multiple microservices in one repo',
        'Shared server & database configs',
        'Service-to-service communication',
        'Unified build and deployment'
      ],
      badge: 'ENTERPRISE',
      color: 'blue',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'lambda',
      title: 'Serverless',
      subtitle: 'Lambda Functions',
      description: 'Create serverless functions for AWS Lambda, Google Cloud, Vercel, or other platforms',
      icon: Zap,
      features: [
        'AWS, Google Cloud, Vercel support',
        'Auto-scaling & cost-effective',
        'Event-driven architecture',
        'Database integration'
      ],
      badge: 'CLOUD',
      color: 'purple',
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: 'backend',
      title: 'Backend Service',
      subtitle: 'Single Application',
      description: 'Generate a complete backend service with REST APIs, database, and authentication',
      icon: Server,
      features: [
        'Native HTTP, Fastify, Express, Encore',
        'Full database support',
        'API configuration',
        'Built-in features & integrations'
      ],
      badge: 'POPULAR',
      color: 'green',
      gradient: 'from-green-500/20 to-emerald-500/20'
    }
  ];

  return (
    <div className="home-page" data-testid="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <Rocket className="logo-icon" />
            <div>
              <h1><span style={{ color: '#07E770' }}>Node-Boot</span> Scaffolder</h1>
              <p>Project Generator</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge" data-testid="hero-badge">
            <Sparkles className="w-4 h-4" />
            <span>Quick Start Generator</span>
          </div>
          <h2 className="hero-title">Choose Your Project Type</h2>
          <p className="hero-subtitle">
            Select the type of Node-Boot project you want to create.
            Each template is optimized for different use cases.
          </p>
        </div>
      </section>

      {/* Project Types Grid */}
      <section className="project-types-section">
        <div className="project-types-grid">
          {projectTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.id} 
                className={`project-type-card ${type.color}`}
                data-testid={`project-type-${type.id}`}
              >
                <div className="card-badge">{type.badge}</div>
                <div className="card-icon-wrapper">
                  <Icon className="card-icon" />
                </div>
                <h3 className="card-title">{type.title}</h3>
                <p className="card-subtitle">{type.subtitle}</p>
                <p className="card-description">{type.description}</p>
                
                <ul className="card-features">
                  {type.features.map((feature, idx) => (
                    <li key={idx}>
                      <div className="feature-dot" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate(`/scaffolder/${type.id}`)}
                  className="card-button"
                  data-testid={`start-${type.id}`}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-grid">
          <div className="info-item">
            <Layers className="info-icon" />
            <h4>Production Ready</h4>
            <p>All templates follow Node-Boot best practices</p>
          </div>
          <div className="info-item">
            <Cloud className="info-icon" />
            <h4>Cloud Optimized</h4>
            <p>Deploy to any cloud platform instantly</p>
          </div>
          <div className="info-item">
            <Code2 className="info-icon" />
            <h4>TypeScript First</h4>
            <p>Full type safety and modern tooling</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>Built by Node-Boot Team</p>
      </footer>
    </div>
  );
};

const Sparkles = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export default HomePage;
