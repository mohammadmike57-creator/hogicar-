import * as React from 'react';
import SEOMetadata from '../components/SEOMetadata';
import { Briefcase, MapPin, Clock, Upload, ArrowRight, CheckCircle, Search } from 'lucide-react';

const OPEN_POSITIONS = [
    {
        id: 1,
        title: "Senior Full Stack Engineer",
        department: "Engineering",
        location: "Remote / London",
        type: "Full-time",
        description: "Join our core team to build the next generation of car rental aggregation technology."
    },
    {
        id: 2,
        title: "Product Marketing Manager",
        department: "Marketing",
        location: "New York, NY",
        type: "Full-time",
        description: "Lead our go-to-market strategy for new supplier partnerships and B2C growth."
    },
    {
        id: 3,
        title: "Customer Support Specialist",
        department: "Operations",
        location: "Remote (European Timezone)",
        type: "Full-time",
        description: "Provide world-class support to our global customer base via chat and email."
    },
    {
        id: 4,
        title: "Data Analyst",
        department: "Data",
        location: "Remote",
        type: "Contract",
        description: "Analyze booking trends to optimize pricing algorithms and inventory distribution."
    }
];

const Careers: React.FC = () => {
    const [selectedJob, setSelectedJob] = React.useState<number | null>(null);
    const [applicationSent, setApplicationSent] = React.useState(false);
    
    // Form State
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [resume, setResume] = React.useState<File | null>(null);
    const [coverLetter, setCoverLetter] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            setApplicationSent(true);
            window.scrollTo(0, 0);
        }, 800);
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <SEOMetadata 
                title="Careers at Hogicar | Join Our Team" 
                description="Explore career opportunities at Hogicar. We are hiring engineers, marketers, and support specialists to revolutionize car rental." 
            />

            {/* Hero Section */}
            <section className="bg-[#003580] text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Build the Future of Travel</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
                        We are on a mission to make car rental transparent, affordable, and accessible for everyone, everywhere.
                    </p>
                    <a href="#open-positions" className="inline-block bg-[#febb02] text-slate-900 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transition-colors">
                        View Open Positions
                    </a>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Job Listings Column */}
                <div className="lg:col-span-2" id="open-positions">
                    <div className="flex items-center gap-3 mb-8">
                        <Briefcase className="w-6 h-6 text-blue-600"/>
                        <h2 className="text-2xl font-bold text-slate-900">Open Positions</h2>
                    </div>

                    <div className="space-y-4">
                        {OPEN_POSITIONS.map(job => (
                            <div 
                                key={job.id} 
                                className={`bg-white p-6 rounded-xl border transition-all cursor-pointer ${selectedJob === job.id ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md'}`}
                                onClick={() => { setSelectedJob(job.id); setApplicationSent(false); }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                                        <p className="text-sm text-blue-600 font-medium">{job.department}</p>
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">{job.type}</span>
                                </div>
                                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{job.description}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {job.location}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Posted 2 days ago</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-xl text-center">
                        <h3 className="font-bold text-blue-900 mb-2">Don't see the right role?</h3>
                        <p className="text-sm text-blue-700 mb-4">We are always looking for talent. Submit a general application below.</p>
                        <button onClick={() => { setSelectedJob(null); setApplicationSent(false); }} className="text-sm font-bold text-blue-600 underline hover:text-blue-800">Apply generally</button>
                    </div>
                </div>

                {/* Application Form Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 sticky top-24">
                        {applicationSent ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8"/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Application Received!</h3>
                                <p className="text-slate-500 text-sm">Thanks for applying to Hogicar. We'll be in touch shortly.</p>
                                <button onClick={() => setApplicationSent(false)} className="mt-6 text-blue-600 text-sm font-bold hover:underline">Submit another application</button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">
                                    {selectedJob ? `Apply for ${OPEN_POSITIONS.find(j => j.id === selectedJob)?.title}` : "General Application"}
                                </h3>
                                <p className="text-xs text-slate-500 mb-6">Complete the form below to join our team.</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-3 py-2"
                                            placeholder="Jane Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            required 
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-3 py-2"
                                            placeholder="jane@example.com"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Resume / CV</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors cursor-pointer relative">
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={e => setResume(e.target.files ? e.target.files[0] : null)}
                                            />
                                            <div className="space-y-1 text-center pointer-events-none">
                                                <Upload className="mx-auto h-8 w-8 text-slate-400" />
                                                <div className="flex text-sm text-slate-600">
                                                    <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                        {resume ? resume.name : 'Upload a file'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500">PDF, DOC up to 10MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Cover Letter (Optional)</label>
                                        <textarea 
                                            rows={4} 
                                            value={coverLetter}
                                            onChange={e => setCoverLetter(e.target.value)}
                                            className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-3 py-2"
                                            placeholder="Tell us why you're a great fit..."
                                        ></textarea>
                                    </div>

                                    <button type="submit" className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition-transform active:scale-95 text-sm">
                                        Submit Application <ArrowRight className="w-4 h-4"/>
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Careers;