/**
 * CAPE Team Directory — single source of truth for all employee data.
 *
 * PHILOSOPHY: The platform never fabricates employee information.
 * Fields that have not been entered by the employee are stored as null/empty
 * and displayed as editable placeholders in the UI.
 *
 * Verified fields (from onboarding data — always present):
 *   id, firstName, lastName, initials, location, phone, email,
 *   locallyYoursEmail
 *
 * dept: string[] — a person can belong to more than one department
 *   (e.g. someone working across both Hospitality and Production).
 *   Empty array until set.
 *
 * Employee-owned profile fields (null until the employee fills them in):
 *   title, yearsAtCape, languages, expertise (string[] - tags),
 *   certifications, bio, preferredName, photo
 *
 * Organizational tier (null for most people — set explicitly for the
 * handful of Founders / Global Leadership; everyone else groups by
 * their `region` field instead):
 *   tier: 'Founder' | 'Leadership' | null
 *
 * Auto-populated from project assignments (never manually edited):
 *   currentProjects, pastProjects
 *
 * Reserved for future features (not built yet):
 *   timezone, availability, resumeUrl, linkedIn
 */

export const CAPE_DIRECTORY = [
  /* ─────────────────────────────────────────────────────────
     Verified employee data — sourced from onboarding records.
     Profile fields left null — employees complete their own profiles.
     ───────────────────────────────────────────────────────── */

  { id:'cape-brown',       firstName:'Brown',       lastName:'Bartholomew', initials:'BB', location:'New York, NY',         phone:'917-494-5931',    email:'brown@capecreative.co',          locallyYoursEmail:'',                      dept:[],
    title:'Founder', yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:'North America', tier:'Founder', preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-jessica-r',   firstName:'Jessica',     lastName:'Resler',      initials:'JR', location:'Brooklyn, NY',         phone:'206-406-4826',    email:'jessica@capecreative.co',        locallyYoursEmail:'jess@locally-yours.com',dept:[],
    title:'Founder', yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:'North America', tier:'Founder', preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-john',        firstName:'John',        lastName:'Bassett',     initials:'JB', location:'Los Angeles, CA',      phone:'818-515-7695',    email:'john@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-trisha',      firstName:'Trisha',      lastName:'Beckman',     initials:'TB', location:'Mapleton, IL',         phone:'309-634-9780',    email:'trisha@capecreative.co',         locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-chad',        firstName:'Chad',        lastName:'Bolduc',      initials:'CB', location:'Los Angeles, CA',      phone:'802-233-4285',    email:'chad@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:'Head of Strategy', yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:'North America', tier:'Leadership', preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-wes',         firstName:'Wes',         lastName:'Burnley',     initials:'WB', location:'New York, NY',         phone:'910-584-2208',    email:'wes@capecreative.co',            locallyYoursEmail:'',                      dept:[],
    title:'Head of Operations', yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:'North America', tier:'Leadership', preferredName:null, photo:null, currentProjects:['Nike Paris Pop-Up','Apple Dinner'], pastProjects:['Cartier NY Gala'] },

  { id:'cape-viviana',     firstName:'Viviana',     lastName:'Cabrera',     initials:'VC', location:'Mexico City, Mexico',  phone:'+52 3331673247',  email:'viviana@capecreative.co',        locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Apple Dinner'], pastProjects:[] },

  { id:'cape-jamie',       firstName:'Jamie',       lastName:'Cameron',     initials:'JC', location:'London, UK',           phone:'+44 7904932020',  email:'jamiecameron@capecreative.co',   locallyYoursEmail:'jamie@locally-yours.com',dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Adidas London'], pastProjects:[] },

  { id:'cape-flor',        firstName:'Flor',        lastName:'Capistran',   initials:'FC', location:'Oaxaca, Mexico',       phone:'+52 5539006530',  email:'flor@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-korina',      firstName:'Korina',      lastName:'Carpenter',   initials:'KC', location:'Brooklyn, NY',         phone:'850-321-5838',    email:'korina@capecreative.co',         locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Apple Dinner','Hermès NYC'], pastProjects:['Cartier NY Gala'] },

  { id:'cape-trevor',      firstName:'Trevor',      lastName:'Carr',        initials:'TC', location:'Ventura, CA',          phone:'805-218-3773',    email:'trevor@capecreative.co',         locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-luca',        firstName:'Luca',        lastName:'Del Vescovo', initials:'LD', location:'Rome, Italy',          phone:'+39 3482832132',  email:'luca@capecreative.co',           locallyYoursEmail:'luca@locally-yours.com',dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Louis Vuitton Tokyo','Hermès NYC'], pastProjects:[] },

  { id:'cape-dana',        firstName:'Dana',        lastName:'Ericson',     initials:'DE', location:'Brooklyn, NY',         phone:'917-287-0645',    email:'dana@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-jessica-h',   firstName:'Jessica',     lastName:'Heiman',      initials:'JH', location:'Honolulu, HI',         phone:'206-601-4409',    email:'jessicaheiman@capecreative.co',  locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-raph',        firstName:'Raph',        lastName:'Isvy',        initials:'RI', location:'Paris, France',        phone:'+33 625757166',   email:'raph@capecreative.co',           locallyYoursEmail:'raph@locally-yours.com',dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Moncler Milan'], pastProjects:['Prada Paris'] },

  { id:'cape-kellie',      firstName:'Kellie',      lastName:'Kalvig',      initials:'KK', location:'Seattle, WA',          phone:'917-945-2774',    email:'kellie@capecreative.co',         locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Apple Dinner'], pastProjects:[] },

  { id:'cape-adma',        firstName:'Adma',        lastName:'Kawage',      initials:'AK', location:'Mexico City, Mexico',  phone:'+33 680237264',   email:'adma@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-faith',       firstName:'Faith',       lastName:'King',        initials:'FK', location:'Brooklyn, NY',         phone:'310-413-3381',    email:'faith@capecreative.co',          locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-teekay',      firstName:'Teekay',      lastName:'Kong',        initials:'TK', location:'Queens, NY',           phone:'929-425-7904',    email:'teekay@capecreative.co',         locallyYoursEmail:'teekay@locally-yours.com',dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Spotify SXSW','Apple Dinner'], pastProjects:['Cartier NY Gala','Prada Paris'] },

  { id:'cape-vanessa',     firstName:'Vanessa',     lastName:'Kyriazi',     initials:'VK', location:'Athens, Greece',       phone:'+30 6945159636',  email:'vanessa@capecreative.co',        locallyYoursEmail:'vanessa@locally-yours.com',dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Dior Dubai'], pastProjects:[] },

  { id:'cape-seth',        firstName:'Seth',        lastName:'Levine',      initials:'SL', location:'Quebec, Canada',       phone:'438-872-1424',    email:'seth@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-alvaro',      firstName:'Alvaro',      lastName:'Mayorga',     initials:'AM', location:'Mexico City, Mexico',  phone:'+52 5559063263',  email:'alvaromayorga@capecreative.co',  locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-billy',       firstName:'Billy',       lastName:'McFeely',     initials:'BM', location:'New York, NY',         phone:'516-425-2561',    email:'billy@capecreative.co',          locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Apple Dinner'], pastProjects:[] },

  { id:'cape-genevieve',   firstName:'Genevieve',   lastName:'McGreevy',    initials:'GM', location:'Austin, TX',           phone:'805-708-0700',    email:'genevieve@capecreative.co',      locallyYoursEmail:'',                      dept:[],
    title:'Head of Business', yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:'North America', tier:'Leadership', preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-bree',        firstName:'Bree',        lastName:'McKenna',     initials:'BM', location:'Seattle, WA',          phone:'206-310-4301',    email:'bree@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-megan',       firstName:'Megan',       lastName:'Monaghan',    initials:'MM', location:'London, UK',           phone:'+44 7824877810',  email:'megan@capecreative.co',          locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-jeremy',      firstName:'Jeremy',      lastName:'Paul',        initials:'JP', location:'Toronto, Canada',      phone:'514-963-3624',    email:'jeremy@capecreative.co',         locallyYoursEmail:'jeremy@locally-yours.com',dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Moncler Milan','Adidas London'], pastProjects:['Prada Paris'] },

  { id:'cape-holly',       firstName:'Holly',       lastName:'Peters',      initials:'HP', location:'Vancouver, Canada',    phone:'416-828-0174',    email:'holly@capecreative.co',          locallyYoursEmail:'holly@locally-yours.com',dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Louis Vuitton Tokyo','Dior Dubai'], pastProjects:[] },

  { id:'cape-kelly',       firstName:'Kelly',       lastName:'Pudik',       initials:'KP', location:'Mapleton, IL',         phone:'309-258-3217',    email:'kelly@capecreative.co',          locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-stefan',      firstName:'Stefan',      lastName:'Rubicz',      initials:'SR', location:'Seattle, WA',          phone:'206-631-9498',    email:'stefan@capecreative.co',         locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:['Apple Dinner'], pastProjects:['Spotify SXSW'] },

  { id:'cape-chris',       firstName:'Christopher', lastName:'Sechler',     initials:'CS', location:'New York, NY',         phone:'724-683-1362',    email:'chrissechler@capecreative.co',   locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-liz',         firstName:'Liz',         lastName:'Stiles',      initials:'LS', location:'Brooklyn, NY',         phone:'201-988-6178',    email:'liz@capecreative.co',            locallyYoursEmail:'liz@locally-yours.com',  dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-manuel',      firstName:'Manuel',      lastName:'Trani',       initials:'MT', location:'Mexico City, Mexico',  phone:'+52 5528980754',  email:'manuel@capecreative.co',         locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-brett',       firstName:'Brett',       lastName:'Weinstein',   initials:'BW', location:'Brooklyn, NY',           phone:'847-637-6049',    email:'brett@capecreative.co',          locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-josh',        firstName:'Josh',        lastName:'Wilson',      initials:'JW', location:'Brooklyn, NY',         phone:'201-316-3782',    email:'josh@capecreative.co',           locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-kyra',        firstName:'Kyra',        lastName:'Wilson',      initials:'KW', location:'Vancouver, Canada',    phone:'604-306-4310',    email:'kyra@capecreative.co',           locallyYoursEmail:'kyra@locally-yours.com', dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },

  { id:'cape-lina',        firstName:'Lina',        lastName:'Fuller',      initials:'LF', location:'San Francisco, CA',    phone:'703-851-2370',    email:'linafuller@capecreative.co',     locallyYoursEmail:'',                      dept:[],
    title:null, yearsAtCape:null, languages:null, expertise:[], certifications:null, bio:null, region:null, tier:null, preferredName:null, photo:null, currentProjects:[], pastProjects:[] },
]

/* ── Convenience helpers ──────────────────────────────────── */
export const getEmployee = id => CAPE_DIRECTORY.find(p => p.id === id) || null
export const DEPARTMENTS = ['Strategy','Creative','Production','Hospitality','Client Services','Design','Fabrication','AV / Tech','Finance','Leadership','Operations','Other']

/* Broad working regions for the Region filter dropdown */
export const REGIONS = ['North America', 'Latin America', 'Europe', 'Asia']

const REGION_MAP = {
  'North America': ['New York', 'Brooklyn', 'Queens', 'Los Angeles', 'Ventura', 'Mapleton', 'Austin', 'Seattle', 'Honolulu', 'San Francisco', 'Vancouver', 'Quebec', 'Toronto', ', NY', ', CA', ', IL', ', TX', ', WA', ', HI'],
  'Europe':        ['London', 'Paris', 'Rome', 'Athens', 'UK', 'France', 'Italy', 'Greece', 'Dubai', 'Riyadh', 'Cape Town', 'Lagos'],
  'Latin America': ['Mexico City', 'Oaxaca', 'Mexico'],
  'Asia':          ['Tokyo', 'Sydney', 'Singapore', 'Hong Kong', 'Seoul'],
}
export const getRegion = location => {
  if (!location) return 'North America'
  for (const [region, terms] of Object.entries(REGION_MAP)) {
    if (terms.some(t => location.includes(t))) return region
  }
  return 'North America'
}
