const content = `# CVMeld

> CVMeld helps job seekers create a base CV and tailor it to each job opportunity.

## Public pages

- [Home](https://cvmeld.tonyml.com/en): AI resume builder and job application workflow.
- [Home in Spanish](https://cvmeld.tonyml.com/es): Generador y adaptador de CV con IA.
- [About](https://cvmeld.tonyml.com/en/about): Product and project information.
- [Limits](https://cvmeld.tonyml.com/en/limits): Usage limits and plan information.
- [Privacy](https://cvmeld.tonyml.com/en/privacy): Privacy policy.
- [Terms](https://cvmeld.tonyml.com/en/terms): Terms of service.
- [Blog](https://cvmeld.tonyml.com/en/blog): Practical guidance for resumes and job applications.

## Core capabilities

- Create an ATS-readable base CV.
- Tailor a CV to a specific job description.
- Compare candidate experience with job requirements.
- Prepare applications and interviews.
- Identify skill gaps and learning opportunities.

## Content principles

CVMeld must not invent testimonials, ratings, employment history, credentials, contact data, or business claims. AI-generated CV content must remain grounded in the candidate's real information.
`

export function GET() {
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
