import React, {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Input} from '../components/ui/input';
import {Textarea} from '../components/ui/textarea';
import {Label} from '../components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../components/ui/select';
import {Checkbox} from '../components/ui/checkbox';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Code2,
    Database,
    Download,
    Home,
    Loader2,
    Play,
    Plus,
    Rocket,
    Server,
    Settings,
    Sparkles,
    Trash2,
    Zap
} from 'lucide-react';
import {toast} from 'sonner';
import {Toaster} from '../components/ui/sonner';
import {CopilotSidebar} from '@copilotkit/react-ui';
import ThemeToggle from '../components/ThemeToggle';
import './ScaffolderPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STEPS = [
    {id: 1, title: 'Project Info', icon: Rocket, description: 'Basic details'},
    {id: 2, title: 'Runtime', icon: Server, description: 'Server framework'},
    {id: 3, title: 'Database', icon: Database, description: 'Data persistence'},
    {id: 4, title: 'API Config', icon: Code2, description: 'API settings'},
    {id: 5, title: 'Features', icon: Zap, description: 'Extra capabilities'},
    {id: 6, title: 'Generate', icon: Sparkles, description: 'Create project'}
];

const ScaffolderPage = () => {
    const {projectType} = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generatedProject, setGeneratedProject] = useState(null);
    const [copiedFile, setCopiedFile] = useState(null);

    // Step 1: Project Info
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');

    // Step 2: Runtime/Lambda Type
    const [runtime, setRuntime] = useState('native-http');
    const [lambdaProvider, setLambdaProvider] = useState('aws');

    // Monorepo - Microservices
    const [microservices, setMicroservices] = useState([
        {name: '', description: '', port: '3000'}
    ]);

    // Step 3: Database
    const [database, setDatabase] = useState('sqlite');
    const [databaseName, setDatabaseName] = useState('');

    // Step 4: API Config (backend only)
    const [apiBasePath, setApiBasePath] = useState('/api');
    const [port, setPort] = useState('3000');
    const [enableValidation, setEnableValidation] = useState(true);
    const [enableSwagger, setEnableSwagger] = useState(true);

    // Step 5: Features
    const [features, setFeatures] = useState({
        authentication: false,
        authorization: false,
        actuator: false,
        scheduling: false,
        httpClients: false,
        cors: true
    });

    // Dynamic steps based on project type
    const getSteps = () => {
        const baseSteps = [
            {id: 1, title: 'Project Info', icon: Rocket, description: 'Basic details'}
        ];

        if (projectType === 'monorepo') {
            return [
                ...baseSteps,
                {id: 2, title: 'Microservices', icon: Server, description: 'Define services'},
                {id: 3, title: 'Runtime', icon: Code2, description: 'Server framework'},
                {id: 4, title: 'Database', icon: Database, description: 'Data persistence'},
                {id: 5, title: 'Generate', icon: Sparkles, description: 'Create project'}
            ];
        } else if (projectType === 'lambda') {
            return [
                ...baseSteps,
                {id: 2, title: 'Provider', icon: Zap, description: 'Lambda platform'},
                {id: 3, title: 'Database', icon: Database, description: 'Data persistence'},
                {id: 4, title: 'Features', icon: Settings, description: 'Configurations'},
                {id: 5, title: 'Generate', icon: Sparkles, description: 'Create project'}
            ];
        } else {
            return [
                ...baseSteps,
                {id: 2, title: 'Runtime', icon: Server, description: 'Server framework'},
                {id: 3, title: 'Database', icon: Database, description: 'Data persistence'},
                {id: 4, title: 'API Config', icon: Code2, description: 'API settings'},
                {id: 5, title: 'Features', icon: Zap, description: 'Extra capabilities'},
                {id: 6, title: 'Generate', icon: Sparkles, description: 'Create project'}
            ];
        }
    };

    const STEPS = getSteps();

    const handleFeatureToggle = (feature) => {
        setFeatures(prev => ({...prev, [feature]: !prev[feature]}));
    };

    const addMicroservice = () => {
        setMicroservices([...microservices, {name: '', description: '', port: `${3000 + microservices.length}`}]);
    };

    const removeMicroservice = (index) => {
        if (microservices.length > 1) {
            setMicroservices(microservices.filter((_, i) => i !== index));
        }
    };

    const updateMicroservice = (index, field, value) => {
        const updated = [...microservices];
        updated[index][field] = value;
        setMicroservices(updated);
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return projectName.trim() && description.trim();
            case 2:
                if (projectType === 'monorepo') {
                    return microservices.every(ms => ms.name.trim() && ms.description.trim());
                } else if (projectType === 'lambda') {
                    return lambdaProvider;
                } else {
                    return runtime;
                }
            case 3:
                if (projectType === 'backend') return database;
                return true;
            case 4:
                if (projectType === 'backend') return apiBasePath && port;
                return true;
            case 5:
                return true;
            default:
                return true;
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const featuresArray = Object.entries(features)
                .filter(([_, enabled]) => enabled)
                .map(([feature, _]) => feature);

            const payload = {
                project_type: projectType,
                project_name: projectName,
                description: description,
                features: featuresArray,
                config: {
                    database: database,
                    database_name: databaseName || `${projectName}-db`,
                }
            };

            // Add type-specific configs
            if (projectType === 'monorepo') {
                payload.template = runtime;
                payload.microservices = microservices;
            } else if (projectType === 'lambda') {
                payload.lambda_provider = lambdaProvider;
            } else {
                payload.template = runtime;
                payload.config.api_base_path = apiBasePath;
                payload.config.port = parseInt(port);
                payload.config.enable_validation = enableValidation;
                payload.config.enable_swagger = enableSwagger;
            }

            const response = await axios.post(`${API}/generate-project`, payload);

            setGeneratedProject(response.data);
            toast.success('🎉 Project generated successfully!');
        } catch (error) {
            console.error('Generation error:', error);
            toast.error('Failed to generate project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (content, fileName) => {
        navigator.clipboard.writeText(content);
        setCopiedFile(fileName);
        toast.success(`Copied ${fileName}`);
        setTimeout(() => setCopiedFile(null), 2000);
    };

    const downloadProject = () => {
        if (!generatedProject) return;
        const zipContent = JSON.stringify({files: generatedProject.files}, null, 2);
        const blob = new Blob([zipContent], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName || 'project'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('📦 Project downloaded!');
    };

    const renderStepContent = () => {
        // Step 1: Project Info (same for all types)
        if (currentStep === 1) {
            return (
                <div className="step-content" data-testid="step-project-info">
                    <div className="step-header">
                        <Rocket className="step-icon"/>
                        <div>
                            <h2>Project Information</h2>
                            <p>Let's start with the basics</p>
                        </div>
                    </div>
                    <div className="form-fields">
                        <div className="form-group">
                            <Label htmlFor="projectName">Project Name *</Label>
                            <Input
                                id="projectName"
                                placeholder="my-awesome-project"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                data-testid="project-name-input"
                            />
                        </div>
                        <div className="form-group">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder={
                                    projectType === 'monorepo'
                                        ? 'A microservices architecture with multiple services'
                                        : projectType === 'lambda'
                                            ? 'A serverless function for event processing'
                                            : 'A REST API for managing tasks with authentication'
                                }
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                data-testid="description-input"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Step 2 varies by project type
        if (currentStep === 2) {
            // Monorepo: Microservices configuration
            if (projectType === 'monorepo') {
                return (
                    <div className="step-content" data-testid="step-microservices">
                        <div className="step-header">
                            <Server className="step-icon"/>
                            <div>
                                <h2>Define Microservices</h2>
                                <p>Configure each service in your monorepo</p>
                            </div>
                        </div>
                        <div className="microservices-list">
                            {microservices.map((service, index) => (
                                <Card key={index} className="microservice-card">
                                    <div className="microservice-header">
                                        <h4>Service {index + 1}</h4>
                                        {microservices.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeMicroservice(index)}
                                                data-testid={`remove-service-${index}`}
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        )}
                                    </div>
                                    <div className="form-fields">
                                        <div className="form-group">
                                            <Label>Service Name *</Label>
                                            <Input
                                                placeholder="user-service"
                                                value={service.name}
                                                onChange={(e) => updateMicroservice(index, 'name', e.target.value)}
                                                data-testid={`service-name-${index}`}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <Label>Description *</Label>
                                            <Input
                                                placeholder="Handles user authentication and management"
                                                value={service.description}
                                                onChange={(e) => updateMicroservice(index, 'description', e.target.value)}
                                                data-testid={`service-desc-${index}`}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <Label>Port</Label>
                                            <Input
                                                type="number"
                                                value={service.port}
                                                onChange={(e) => updateMicroservice(index, 'port', e.target.value)}
                                                data-testid={`service-port-${index}`}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button
                                variant="outline"
                                onClick={addMicroservice}
                                className="add-service-button"
                                data-testid="add-service"
                            >
                                <Plus className="w-4 h-4 mr-2"/>
                                Add Microservice
                            </Button>
                        </div>
                    </div>
                );
            }

            // Lambda: Provider selection
            if (projectType === 'lambda') {
                return (
                    <div className="step-content" data-testid="step-lambda-provider">
                        <div className="step-header">
                            <Zap className="step-icon"/>
                            <div>
                                <h2>Lambda Provider</h2>
                                <p>Choose your serverless platform</p>
                            </div>
                        </div>
                        <div className="options-grid">
                            {[
                                {id: 'aws', name: 'AWS Lambda', desc: 'Amazon Web Services'},
                                {id: 'gcp', name: 'Google Cloud', desc: 'Cloud Functions'},
                                {id: 'vercel', name: 'Vercel', desc: 'Serverless Functions'},
                                {id: 'netlify', name: 'Netlify', desc: 'Functions'}
                            ].map(provider => (
                                <div
                                    key={provider.id}
                                    className={`option-card ${lambdaProvider === provider.id ? 'active' : ''}`}
                                    onClick={() => setLambdaProvider(provider.id)}
                                    data-testid={`lambda-${provider.id}`}
                                >
                                    <div className="option-badge">{provider.id.toUpperCase()}</div>
                                    <h3>{provider.name}</h3>
                                    <p>{provider.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // Backend: Runtime selection (original)
            return (
                <div className="step-content" data-testid="step-runtime">
                    <div className="step-header">
                        <Server className="step-icon"/>
                        <div>
                            <h2>Choose Your Runtime</h2>
                            <p>Select the HTTP server framework</p>
                        </div>
                    </div>
                    <div className="options-grid">
                        <div
                            className={`option-card ${runtime === 'native-http' ? 'active' : ''}`}
                            onClick={() => setRuntime('native-http')}
                            data-testid="runtime-native-http"
                        >
                            <div className="option-badge">NATIVE</div>
                            <h3>Native HTTP</h3>
                            <p>Node.js built-in http server</p>
                            <ul className="option-features">
                                <li>Zero dependencies</li>
                                <li>Lightweight</li>
                                <li>Maximum control</li>
                            </ul>
                        </div>
                        <div
                            className={`option-card ${runtime === 'fastify' ? 'active' : ''}`}
                            onClick={() => setRuntime('fastify')}
                            data-testid="runtime-fastify"
                        >
                            <div className="option-badge">FAST</div>
                            <h3>Fastify</h3>
                            <p>High-performance framework</p>
                            <ul className="option-features">
                                <li>Blazing fast</li>
                                <li>Schema validation</li>
                                <li>Plugin ecosystem</li>
                            </ul>
                        </div>
                        <div
                            className={`option-card ${runtime === 'express' ? 'active' : ''}`}
                            onClick={() => setRuntime('express')}
                            data-testid="runtime-express"
                        >
                            <div className="option-badge">BATTLE-TESTED</div>
                            <h3>Express</h3>
                            <p>Most popular Node.js framework</p>
                            <ul className="option-features">
                                <li>Huge ecosystem</li>
                                <li>Battle-tested</li>
                                <li>Easy to learn</li>
                            </ul>
                        </div>
                        <div
                            className={`option-card ${runtime === 'koa' ? 'active' : ''}`}
                            onClick={() => setRuntime('koa')}
                            data-testid="runtime-koa"
                        >
                            <div className="option-badge">EXPRESSIVE</div>
                            <h3>Koa</h3>
                            <p>Next generation server framework</p>
                            <ul className="option-features">
                                <li>Async/await native</li>
                                <li>Lightweight core</li>
                                <li>Better error handling</li>
                            </ul>
                        </div>
                        <div
                            className={`option-card ${runtime === 'encore' ? 'active' : ''}`}
                            onClick={() => setRuntime('encore')}
                            data-testid="runtime-encore"
                        >
                            <div className="option-badge">AUTOMATED</div>
                            <h3>Encore</h3>
                            <p>Type-safe backend framework</p>
                            <ul className="option-features">
                                <li>Automated infrastructure</li>
                                <li>Type-safe by design</li>
                                <li>Built-in observability</li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        // Step 3 varies by project type
        if (currentStep === 3) {
            // Monorepo: Runtime selection
            if (projectType === 'monorepo') {
                return (
                    <div className="step-content" data-testid="step-runtime">
                        <div className="step-header">
                            <Code2 className="step-icon"/>
                            <div>
                                <h2>Choose Server Framework</h2>
                                <p>Select framework for all microservices</p>
                            </div>
                        </div>
                        <div className="options-grid">
                            <div
                                className={`option-card ${runtime === 'native-http' ? 'active' : ''}`}
                                onClick={() => setRuntime('native-http')}
                                data-testid="runtime-native-http"
                            >
                                <div className="option-badge">NATIVE</div>
                                <h3>Native HTTP</h3>
                                <p>Node.js built-in http server</p>
                            </div>
                            <div
                                className={`option-card ${runtime === 'fastify' ? 'active' : ''}`}
                                onClick={() => setRuntime('fastify')}
                                data-testid="runtime-fastify"
                            >
                                <div className="option-badge">FAST</div>
                                <h3>Fastify</h3>
                                <p>High-performance server framework</p>
                            </div>
                            <div
                                className={`option-card ${runtime === 'express' ? 'active' : ''}`}
                                onClick={() => setRuntime('express')}
                                data-testid="runtime-express"
                            >
                                <div className="option-badge">BATTLE-TESTED</div>
                                <h3>Express</h3>
                                <p>Most popular Node.js framework</p>
                            </div>
                            <div
                                className={`option-card ${runtime === 'koa' ? 'active' : ''}`}
                                onClick={() => setRuntime('koa')}
                                data-testid="runtime-koa"
                            >
                                <div className="option-badge">EXPRESSIVE</div>
                                <h3>Koa</h3>
                                <p>Next generation server framework</p>
                            </div>
                            <div
                                className={`option-card ${runtime === 'encore' ? 'active' : ''}`}
                                onClick={() => setRuntime('encore')}
                                data-testid="runtime-encore"
                            >
                                <div className="option-badge">AUTOMATED</div>
                                <h3>Encore</h3>
                                <p>Type-safe backend framework</p>
                            </div>
                        </div>
                    </div>
                );
            }

            // Lambda & Backend: Database
            return (
                <div className="step-content" data-testid="step-database">
                    <div className="step-header">
                        <Database className="step-icon"/>
                        <div>
                            <h2>Database Configuration</h2>
                            <p>Choose your data persistence layer</p>
                        </div>
                    </div>
                    <div className="form-fields">
                        <div className="form-group">
                            <Label htmlFor="database">Database Type</Label>
                            <Select value={database} onValueChange={setDatabase}>
                                <SelectTrigger data-testid="database-select">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sqlite">SQLite (Default)</SelectItem>
                                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                                    <SelectItem value="mysql">MySQL</SelectItem>
                                    <SelectItem value="mongodb">MongoDB</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="form-group">
                            <Label htmlFor="databaseName">Database Name (Optional)</Label>
                            <Input
                                id="databaseName"
                                placeholder="Leave empty for default"
                                value={databaseName}
                                onChange={(e) => setDatabaseName(e.target.value)}
                                data-testid="database-name-input"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Step 4
        if (currentStep === 4) {
            // Monorepo: Database
            if (projectType === 'monorepo') {
                return (
                    <div className="step-content" data-testid="step-database">
                        <div className="step-header">
                            <Database className="step-icon"/>
                            <div>
                                <h2>Database Configuration</h2>
                                <p>Shared database for all services</p>
                            </div>
                        </div>
                        <div className="form-fields">
                            <div className="form-group">
                                <Label htmlFor="database">Database Type</Label>
                                <Select value={database} onValueChange={setDatabase}>
                                    <SelectTrigger data-testid="database-select">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sqlite">SQLite</SelectItem>
                                        <SelectItem value="postgres">PostgreSQL</SelectItem>
                                        <SelectItem value="mysql">MySQL</SelectItem>
                                        <SelectItem value="mongodb">MongoDB</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="form-group">
                                <Label htmlFor="databaseName">Database Name (Optional)</Label>
                                <Input
                                    id="databaseName"
                                    placeholder="Leave empty for default"
                                    value={databaseName}
                                    onChange={(e) => setDatabaseName(e.target.value)}
                                    data-testid="database-name-input"
                                />
                            </div>
                        </div>
                    </div>
                );
            }

            // Lambda: Features
            if (projectType === 'lambda') {
                return (
                    <div className="step-content" data-testid="step-features">
                        <div className="step-header">
                            <Settings className="step-icon"/>
                            <div>
                                <h2>Lambda Configuration</h2>
                                <p>Configure your serverless function</p>
                            </div>
                        </div>
                        <div className="features-grid">
                            {Object.entries({
                                authentication: {label: 'Authentication', desc: 'Auth integration'},
                                cors: {label: 'CORS', desc: 'Cross-origin support'},
                                httpClients: {label: 'HTTP Clients', desc: 'External API calls'}
                            }).map(([key, {label, desc}]) => (
                                <div
                                    key={key}
                                    className={`feature-card ${features[key] ? 'active' : ''}`}
                                    onClick={() => handleFeatureToggle(key)}
                                    data-testid={`feature-${key}`}
                                >
                                    <Checkbox checked={features[key]}/>
                                    <div>
                                        <h4>{label}</h4>
                                        <p>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // Backend: API Config
            return (
                <div className="step-content" data-testid="step-api-config">
                    <div className="step-header">
                        <Code2 className="step-icon"/>
                        <div>
                            <h2>API Configuration</h2>
                            <p>Configure your API settings</p>
                        </div>
                    </div>
                    <div className="form-fields">
                        <div className="form-row">
                            <div className="form-group">
                                <Label htmlFor="basePath">API Base Path</Label>
                                <Input
                                    id="basePath"
                                    value={apiBasePath}
                                    onChange={(e) => setApiBasePath(e.target.value)}
                                    data-testid="api-base-path-input"
                                />
                            </div>
                            <div className="form-group">
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    data-testid="port-input"
                                />
                            </div>
                        </div>
                        <div className="checkbox-group">
                            <div className="checkbox-item">
                                <Checkbox
                                    id="validation"
                                    checked={enableValidation}
                                    onCheckedChange={setEnableValidation}
                                    data-testid="enable-validation"
                                />
                                <Label htmlFor="validation">Enable Request Validation</Label>
                            </div>
                            <div className="checkbox-item">
                                <Checkbox
                                    id="swagger"
                                    checked={enableSwagger}
                                    onCheckedChange={setEnableSwagger}
                                    data-testid="enable-swagger"
                                />
                                <Label htmlFor="swagger">Enable Swagger UI</Label>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Step 5
        if (currentStep === 5) {
            // Monorepo & Lambda: Generate
            if (projectType === 'monorepo' || projectType === 'lambda') {
                const finalStep = currentStep === STEPS[STEPS.length - 1].id;
                return renderGenerateStep(finalStep);
            }

            // Backend: Features
            if (projectType === 'backend') {
                return (
                    <div className="step-content" data-testid="step-features">
                        <div className="step-header">
                            <Zap className="step-icon"/>
                            <div>
                                <h2>Features & Integrations</h2>
                                <p>Select additional capabilities</p>
                            </div>
                        </div>
                        <div className="features-grid">
                            {Object.entries({
                                authentication: {label: 'Authentication', desc: 'User auth system'},
                                authorization: {label: 'Authorization', desc: 'Role-based access'},
                                actuator: {label: 'Actuator', desc: 'Health & metrics'},
                                scheduling: {label: 'Scheduling', desc: 'Cron jobs'},
                                httpClients: {label: 'HTTP Clients', desc: 'External API calls'},
                                cors: {label: 'CORS', desc: 'Cross-origin support'}
                            }).map(([key, {label, desc}]) => (
                                <div
                                    key={key}
                                    className={`feature-card ${features[key] ? 'active' : ''}`}
                                    onClick={() => handleFeatureToggle(key)}
                                    data-testid={`feature-${key}`}
                                >
                                    <Checkbox checked={features[key]}/>
                                    <div>
                                        <h4>{label}</h4>
                                        <p>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        // Step 6 - Backend only (Generate)
        if (currentStep === 6) {
            return renderGenerateStep(true);
        }

        return null;
    };

    const renderGenerateStep = (isGenerate) => {
        if (!isGenerate) return null;

        return (
            <div className="step-content" data-testid="step-generate">
                {!generatedProject ? (
                    <>
                        <div className="step-header">
                            <Sparkles className="step-icon sparkle"/>
                            <div>
                                <h2>Ready to Generate!</h2>
                                <p>Your Node-Boot project is ready to be created</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <h3>Configuration Summary</h3>
                            <div className="summary-grid">
                                <div><strong>Project:</strong> {projectName}</div>
                                <div><strong>Type:</strong> {projectType}</div>
                                {projectType === 'monorepo' && (
                                    <div><strong>Services:</strong> {microservices.length}</div>
                                )}
                                {projectType === 'lambda' && (
                                    <div><strong>Provider:</strong> {lambdaProvider}</div>
                                )}
                                {projectType !== 'lambda' && (
                                    <div><strong>Runtime:</strong> {runtime}</div>
                                )}
                                <div><strong>Database:</strong> {database}</div>
                                {projectType === 'backend' && (
                                    <div><strong>Port:</strong> {port}</div>
                                )}
                                <div>
                                    <strong>Features:</strong> {Object.entries(features).filter(([_, v]) => v).length} enabled
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="generate-button-large"
                            size="lg"
                            data-testid="generate-button"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-2 animate-spin"/>
                                    Generating Your Project...
                                </>
                            ) : (
                                <>
                                    <Play className="w-6 h-6 mr-2"/>
                                    Generate Project
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <div className="generation-complete" data-testid="generation-complete">
                        <CheckCircle2 className="success-icon"/>
                        <h2>Project Generated Successfully! 🎉</h2>
                        <p>Your Node-Boot project is ready to download</p>

                        <div className="action-buttons">
                            <Button onClick={downloadProject} size="lg" className="download-button-primary"
                                    data-testid="download-button">
                                <Download className="w-5 h-5 mr-2"/>
                                Download Project
                            </Button>
                        </div>

                        <div className="project-overview">
                            <h3>Project Overview</h3>
                            <div className="overview-grid">
                                <div className="overview-item">
                                    <div className="overview-icon">📄</div>
                                    <div className="overview-content">
                                        <div className="overview-value">
                                            {Object.keys(generatedProject.files).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length}
                                        </div>
                                        <div className="overview-label">TypeScript Files</div>
                                    </div>
                                </div>
                                <div className="overview-item">
                                    <div className="overview-icon">⚙️</div>
                                    <div className="overview-content">
                                        <div className="overview-value">
                                            {Object.keys(generatedProject.files).filter(f =>
                                                f.includes('config') || f.endsWith('.json') || f.endsWith('.yml') || f.endsWith('.yaml')
                                            ).length}
                                        </div>
                                        <div className="overview-label">Config Files</div>
                                    </div>
                                </div>
                                <div className="overview-item">
                                    <div className="overview-icon">🚀</div>
                                    <div className="overview-content">
                                        <div
                                            className="overview-value">{runtime === 'native-http' ? 'Native HTTP' : 'Fastify'}</div>
                                        <div className="overview-label">Server Framework</div>
                                    </div>
                                </div>
                                <div className="overview-item">
                                    <div className="overview-icon">💾</div>
                                    <div className="overview-content">
                                        <div className="overview-value">{database.toUpperCase()}</div>
                                        <div className="overview-label">Database</div>
                                    </div>
                                </div>
                            </div>

                            <div className="features-checklist">
                                <h4>✨ Included Features</h4>
                                <div className="checklist-grid">
                                    {Object.entries(features)
                                        .filter(([_, enabled]) => enabled)
                                        .map(([feature, _]) => (
                                            <div key={feature} className="checklist-item">
                                                <CheckCircle2 className="checklist-icon"/>
                                                <span>{feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                                            </div>
                                        ))}
                                    {Object.values(features).every(v => !v) && (
                                        <div className="checklist-item">
                                            <CheckCircle2 className="checklist-icon"/>
                                            <span>Core Features Only</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="scaffolder-page" data-testid="scaffolder-page">
            <Toaster position="top-right"/>

            <header className="app-header">
                <div className="header-content">
                    <div className="header-left">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            className="back-button"
                            data-testid="back-home"
                        >
                            <Home className="w-4 h-4 mr-2"/>
                            Home
                        </Button>
                        <div className="logo">
                            <Rocket className="logo-icon"/>
                            <div>
                                <h1><span style={{color: '#07E770'}}>Node-Boot</span> Scaffolder</h1>
                                <p>{projectType.charAt(0).toUpperCase() + projectType.slice(1)} Generator</p>
                            </div>
                        </div>
                    </div>
                    <ThemeToggle/>
                </div>
            </header>

            <div className="stepper-container">
                {/* Progress Steps */}
                <div className="stepper-progress">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <React.Fragment key={step.id}>
                                <div
                                    className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                    data-testid={`step-indicator-${step.id}`}
                                >
                                    <div className="step-number">
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5"/> :
                                            <Icon className="w-5 h-5"/>}
                                    </div>
                                    <div className="step-info">
                                        <div className="step-title">{step.title}</div>
                                        <div className="step-desc">{step.description}</div>
                                    </div>
                                </div>
                                {index < STEPS.length - 1 && <div className="step-connector"/>}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Step Content */}
                <Card className="step-card">
                    {renderStepContent()}

                    {/* Navigation Buttons */}
                    {currentStep < 6 && (
                        <div className="step-navigation">
                            {currentStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    data-testid="prev-button"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2"/>
                                    Previous
                                </Button>
                            )}
                            <Button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!canProceed()}
                                className="next-button-primary"
                                data-testid="next-button"
                            >
                                {currentStep === 5 ? 'Review' : 'Next'}
                                <ArrowRight className="w-4 h-4 ml-2"/>
                            </Button>
                        </div>
                    )}
                </Card>
            </div>

            <CopilotSidebar
                labels={{
                    title: 'Node-Boot Assistant',
                    initial: 'Need help configuring your project?'
                }}
                instructions="You are a Node-Boot framework expert. Help users with questions about Node-Boot features, configuration, and best practices."
            />
        </div>
    );
};

export default ScaffolderPage;
