import aiOrchestrationImg from '../images/service-single/web/ai-orchestration-minimal.png'
import finTechImg from '../images/service-single/web/fin-tech-minimal.png'
import cmsImg from '../images/service-single/web/cms-minimal.png'
import elasticSearchImg from '../images/service-single/web/elastic-search-minimal.png'

const Services = [
    {
        Id: '1',
        sImgS: aiOrchestrationImg,
        sTitle: 'AI Workflow Orchestration',
        description:'Built an AI-driven orchestration system that transformed natural-language process documents into executable workflows, solving the challenge of bridging human input and automated systems.',
        icon:'flaticon-vector',
    },
    {
        Id: '2',
        sImgS: finTechImg,
        sTitle: 'Financial Dashboard Applications',
        description:'Designed a micro-frontend dashboard platform to unify financial data across five siloed systems. Tackled the challenge of cross-system integration with shared filters, unified auth, and pluggable components.',
        icon:'flaticon-smartphone',
    },
    {
        Id: '3',
        sImgS: cmsImg,
        sTitle: 'Content Management Systems',
        description:'Engineered a dynamic, schema-driven CMS supporting reusable templates and drag-and-drop dashboards. Solved the problem of scaling content creation for hundreds of client websites.',
        icon:'flaticon-palette',
    },
    {
        Id: '4',
        sImgS: elasticSearchImg,
        sTitle: 'Elastic Search Platform',
        description:'Developed a fuzzy search engine using Elasticsearch and modular UI components, allowing users to find events, venues, and content across thousands of entries. Significantly improved user discovery experience.',
        icon:'flaticon-bar-chart',
    }
]

export default Services;
