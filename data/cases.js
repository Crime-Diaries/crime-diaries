/* Sample case files for the Stage 1 prototype.
   Summaries are original text written from the listed sources; check them against the sources before publishing.
   Rule: facts only here. Unconvicted suspects are never named.
   ll = [lat, lng] of the town or area, for the map; never a house. */
window.FORENSICS = [
  {id:'dna', name:'DNA profiling', blurb:'Comparing variable regions of DNA left at a scene (blood, saliva, skin) against a suspect or a database. Developed by Alec Jeffreys in 1984.'},
  {id:'genealogy', name:'Investigative genetic genealogy', blurb:'Uploading a crime-scene DNA profile to public genealogy databases to find distant relatives, then building family trees to narrow down to one person.'},
  {id:'fingerprints', name:'Fingerprints', blurb:'Ridge patterns on fingers are unique and stable for life. Latent prints are lifted from surfaces and compared point by point.'},
  {id:'cryptanalysis', name:'Cryptanalysis', blurb:'Breaking ciphers and codes left by offenders, often by frequency analysis, pattern-hunting and, today, computer search.'},
  {id:'trace', name:'Trace & material evidence', blurb:'Wood, fibres, soil, paper, money serial numbers, footprints: small physical traces that tie a person or object to a scene.'},
  {id:'profiling', name:'Offender profiling', blurb:'Inferring the likely traits of an unknown offender from how the crimes were committed.'},
  {id:'toxicology', name:'Toxicology', blurb:'Detecting poisons, drugs and their concentrations in the body or in products.'},
  {id:'documents', name:'Document & handwriting analysis', blurb:'Examining letters, notes and envelopes: handwriting, paper, ink, postmarks, and the traces left on them.'}
];

window.CASES = [
  {id:'jack-the-ripper', ll:[51.52,-0.06], no:1, title:'Jack the Ripper', aka:'The Whitechapel murders', country:'United Kingdom', place:'Whitechapel, London', year:1888, type:'Serial murder', status:'Unsolved', tags:['profiling','documents'],
   summary:'In the autumn of 1888 at least five women were murdered in and around the Whitechapel district of London\'s East End. The killer was never identified. Letters sent to the press and police, some almost certainly hoaxes, gave the killer the name that stuck.',
   timeline:[['31 Aug 1888','Mary Ann Nichols is found murdered in Buck\'s Row.'],['8 Sep 1888','Annie Chapman is killed in Hanbury Street.'],['30 Sep 1888','The "double event": Elizabeth Stride and Catherine Eddowes are killed the same night.'],['Oct 1888','The "From Hell" letter arrives with half of a human kidney.'],['9 Nov 1888','Mary Jane Kelly is killed in her room at Miller\'s Court.']],
   forensics:'Police surgeon Thomas Bond wrote one of the earliest offender profiles, describing the likely habits of the killer. Crime-scene photography of a victim in place was also used, which was rare at the time.',
   outcome:'No one was ever charged. More than a hundred people have been proposed as suspects over the years; none has been proved.',
   sources:[['Wikipedia: Jack the Ripper','https://en.wikipedia.org/wiki/Jack_the_Ripper']]},

  {id:'zodiac-killer', ll:[38.1,-122.26], no:2, title:'The Zodiac Killer', aka:'Zodiac', country:'United States', place:'Northern California', year:1968, type:'Serial murder', status:'Unsolved', tags:['cryptanalysis','documents'],
   summary:'A killer who murdered at least five people in Northern California in 1968 and 1969 and taunted police and newspapers with letters and ciphers, signing them with a crossed-circle symbol.',
   timeline:[['20 Dec 1968','Two teenagers are shot dead on Lake Herman Road near Benicia.'],['4 Jul 1969','A shooting at Blue Rock Springs, Vallejo, kills one person and wounds another.'],['Aug 1969','The 408-character cipher is solved by a schoolteacher and his wife.'],['27 Sep 1969','A couple is stabbed at Lake Berryessa; one dies.'],['11 Oct 1969','Taxi driver Paul Stine is shot in San Francisco.'],['Dec 2020','The 340-character cipher is solved by David Oranchak, Sam Blake and Jarl Van Eycke.']],
   forensics:'Codebreakers solved two of the killer\'s ciphers, 51 years apart. Neither revealed a name. The letters themselves have been examined for handwriting, paper and DNA traces.',
   outcome:'The case remains open. No one has been charged.',
   sources:[['Wikipedia: Zodiac Killer','https://en.wikipedia.org/wiki/Zodiac_Killer']]},

  {id:'golden-state-killer', ll:[38.58,-121.49], no:3, title:'The Golden State Killer', aka:'East Area Rapist / Original Night Stalker', country:'United States', place:'California', year:1974, type:'Serial murder', status:'Solved', tags:['dna','genealogy'],
   summary:'Between 1974 and 1986 an offender committed at least 13 murders, around 50 rapes and more than 100 burglaries across California. For decades the crimes were thought to be the work of several different people.',
   timeline:[['1974–1986','Burglaries, rapes and murders across California.'],['2001','DNA links the northern and southern California crimes to one offender.'],['24 Apr 2018','Former police officer Joseph James DeAngelo is arrested.'],['Jun 2020','DeAngelo pleads guilty to 13 murders and admits dozens of other crimes.'],['Aug 2020','He is sentenced to multiple consecutive life terms without parole.']],
   forensics:'The breakthrough case for investigative genetic genealogy. Investigators uploaded crime-scene DNA to a public genealogy site, found distant relatives, built family trees, then confirmed the match with DNA from an item DeAngelo had discarded.',
   outcome:'Convicted on his guilty plea in 2020. The method has since been used to solve hundreds of cold cases.',
   sources:[['Wikipedia: Joseph James DeAngelo','https://en.wikipedia.org/wiki/Joseph_James_DeAngelo']]},

  {id:'lindbergh-kidnapping', ll:[40.39,-74.76], no:4, title:'The Lindbergh kidnapping', aka:'Crime of the Century', country:'United States', place:'Hopewell, New Jersey', year:1932, type:'Kidnapping', status:'Solved', tags:['trace','documents'],
   summary:'The 20-month-old son of aviator Charles Lindbergh was taken from his nursery. A ransom was paid, but the child was later found dead near the family home.',
   timeline:[['1 Mar 1932','Charles Lindbergh Jr. is taken from the house; a homemade ladder is left behind.'],['Apr 1932','A $50,000 ransom is paid, much of it in traceable gold certificates.'],['12 May 1932','The child\'s body is found a few miles from the house.'],['Sep 1934','Bruno Richard Hauptmann is arrested after spending a ransom gold certificate.'],['Feb 1935','Hauptmann is convicted of murder.'],['3 Apr 1936','Hauptmann is executed.']],
   forensics:'Wood expert Arthur Koehler traced the ladder\'s timber to a lumber yard and matched one rail to a floorboard in Hauptmann\'s attic. Handwriting on the ransom notes and the serial numbers of the ransom money were also used.',
   outcome:'Hauptmann was convicted and executed, maintaining his innocence. Some writers still dispute the verdict. The case led to the "Lindbergh Law", making kidnapping across state lines a federal crime.',
   sources:[['Wikipedia: Lindbergh kidnapping','https://en.wikipedia.org/wiki/Lindbergh_kidnapping'],['FBI: The Lindbergh kidnapping','https://www.fbi.gov/history/famous-cases/lindbergh-kidnapping']]},

  {id:'colin-pitchfork', ll:[52.57,-1.2], no:5, title:'The Narborough murders', aka:'Colin Pitchfork case', country:'United Kingdom', place:'Leicestershire, England', year:1983, type:'Murder', status:'Solved', tags:['dna'],
   summary:'Two 15-year-old girls, Lynda Mann and Dawn Ashworth, were raped and murdered in neighbouring Leicestershire villages in 1983 and 1986. The case became the first in which DNA evidence both cleared an innocent suspect and convicted the killer.',
   timeline:[['Nov 1983','Lynda Mann is murdered in Narborough.'],['Jul 1986','Dawn Ashworth is murdered in Enderby.'],['1986','A 17-year-old local suspect confesses to one killing; DNA testing proves he did not commit either.'],['1987','Police ask about 5,000 local men to give blood or saliva samples.'],['Sep 1987','Colin Pitchfork is arrested after a man is overheard saying he gave a sample in Pitchfork\'s place.'],['Jan 1988','Pitchfork is sentenced to life imprisonment.']],
   forensics:'Alec Jeffreys at the University of Leicester had developed DNA fingerprinting in 1984. This case was its first use in a criminal investigation, and the first mass DNA screening.',
   outcome:'Pitchfork pleaded guilty. He was released on parole in 2021 and recalled to prison later that year.',
   sources:[['Wikipedia: Colin Pitchfork','https://en.wikipedia.org/wiki/Colin_Pitchfork']]},

  {id:'black-dahlia', ll:[34.05,-118.24], no:6, title:'The Black Dahlia', aka:'Murder of Elizabeth Short', country:'United States', place:'Los Angeles, California', year:1947, type:'Murder', status:'Unsolved', tags:['fingerprints','documents'],
   summary:'The mutilated body of 22-year-old Elizabeth Short was found in a vacant lot in Leimert Park, Los Angeles. Newspapers named her "the Black Dahlia", and the case became one of the most publicised murders in American history.',
   timeline:[['15 Jan 1947','Short\'s body is found in a vacant lot.'],['24 Jan 1947','An envelope with her belongings is mailed to the Los Angeles Examiner.'],['1947 onward','Dozens of people falsely confess.']],
   forensics:'Short was identified from fingerprints held on file. The envelope sent to the newspaper had been wiped with gasoline, which destroyed most of the fingerprint evidence on it.',
   outcome:'No one has ever been charged.',
   sources:[['Wikipedia: Black Dahlia','https://en.wikipedia.org/wiki/Black_Dahlia']]},

  {id:'db-cooper', ll:[45.9,-122.7], no:7, title:'D. B. Cooper', aka:'The Northwest Orient hijacking', country:'United States', place:'Pacific Northwest', year:1971, type:'Hijacking', status:'Unsolved', tags:['trace'],
   summary:'A man calling himself Dan Cooper hijacked a Boeing 727 flying from Portland to Seattle, collected a $200,000 ransom and four parachutes, then jumped from the rear stairs somewhere over southwest Washington. He was never found.',
   timeline:[['24 Nov 1971','Northwest Orient Flight 305 is hijacked; the hijacker jumps at night in heavy rain.'],['Feb 1980','A boy finds $5,800 of the ransom money on the bank of the Columbia River.'],['Jul 2016','The FBI suspends its active investigation.']],
   forensics:'The ransom money\'s serial numbers had been recorded, which is how the 1980 find was identified. A clip-on tie he left on the plane has been examined for DNA and particles.',
   outcome:'Unsolved. The hijacking led to the "Cooper vane", a device that stops a plane\'s rear stairs being lowered in flight.',
   sources:[['Wikipedia: D. B. Cooper','https://en.wikipedia.org/wiki/D._B._Cooper'],['FBI: D.B. Cooper hijacking','https://www.fbi.gov/history/famous-cases/db-cooper-hijacking']]},

  {id:'somerton-man', ll:[-34.98,138.51], no:8, title:'The Somerton Man', aka:'Tamam Shud case', country:'Australia', place:'Adelaide, South Australia', year:1948, type:'Unexplained death', status:'Unsolved', tags:['genealogy','toxicology','cryptanalysis'],
   summary:'An unidentified man was found dead on Somerton Park beach. A scrap of paper reading "Tamám Shud" (finished) was hidden in his clothing, torn from a copy of the Rubaiyat of Omar Khayyam. The book itself was later found, with a short code-like sequence of letters written in it.',
   timeline:[['1 Dec 1948','The man is found dead on the beach.'],['1949','The book the scrap came from is handed to police.'],['May 2021','The body is exhumed for DNA testing.'],['Jul 2022','Researchers Derek Abbott and Colleen Fitzpatrick identify him as Carl "Charles" Webb, a Melbourne electrical engineer.']],
   forensics:'No poison was found at the time, though pathologists suspected one. Genetic genealogy on hair from the body led to the 2022 identification. The letters in the book have never been convincingly decoded.',
   outcome:'He has a name, but how and why he died remain unknown.',
   sources:[['Wikipedia: Tamam Shud case','https://en.wikipedia.org/wiki/Tamam_Shud_case']]},

  {id:'great-train-robbery', ll:[51.88,-0.68], no:9, title:'The Great Train Robbery', aka:'Bridego Bridge robbery', country:'United Kingdom', place:'Buckinghamshire, England', year:1963, type:'Heist', status:'Solved', tags:['fingerprints'],
   summary:'A gang stopped the Glasgow-to-London Royal Mail train at night by rigging a signal, and stole about £2.6 million. The train driver was badly beaten.',
   timeline:[['8 Aug 1963','The train is stopped near Bridego Bridge and the mail sacks are unloaded.'],['Aug 1963','Police find the gang\'s hideout at Leatherslade Farm.'],['1964','Most of the gang are convicted, many receiving 30-year sentences.'],['1965','Ronald Biggs escapes from prison and lives abroad for decades.']],
   forensics:'The gang failed to clean the farm. Fingerprints on a Monopoly board, a ketchup bottle and other items identified several of them.',
   outcome:'Most of the gang were convicted; most of the money was never recovered.',
   sources:[['Wikipedia: Great Train Robbery (1963)','https://en.wikipedia.org/wiki/Great_Train_Robbery_(1963)']]},

  {id:'gardner-museum-theft', ll:[42.34,-71.1], no:10, title:'The Gardner Museum theft', aka:'Isabella Stewart Gardner Museum robbery', country:'United States', place:'Boston, Massachusetts', year:1990, type:'Art theft', status:'Unsolved', tags:['trace'],
   summary:'Two men dressed as police officers talked their way into the museum after closing, tied up the guards and took 13 works, including Rembrandt\'s only seascape and Vermeer\'s "The Concert". It is often called the largest property theft in history.',
   timeline:[['18 Mar 1990','The thieves spend about 81 minutes inside the museum.'],['2017','The museum doubles its reward to $10 million.']],
   forensics:'Motion-sensor records showed the thieves\' route through the galleries. No forensic breakthrough has been made public.',
   outcome:'None of the works has been recovered. The empty frames still hang in the museum.',
   sources:[['Wikipedia: Isabella Stewart Gardner Museum theft','https://en.wikipedia.org/wiki/Isabella_Stewart_Gardner_Museum_theft']]},

  {id:'antwerp-diamond-heist', ll:[51.22,4.4], no:11, title:'The Antwerp diamond heist', aka:'Heist of the century', country:'Belgium', place:'Antwerp', year:2003, type:'Heist', status:'Solved', tags:['dna','trace'],
   summary:'Over a weekend in February 2003, thieves got past the layered security of the Antwerp Diamond Centre vault and emptied most of its safe-deposit boxes. The haul was estimated at over $100 million.',
   timeline:[['15–16 Feb 2003','The vault is emptied over the weekend.'],['Feb 2003','A bag of the thieves\' rubbish is found dumped in woodland near the motorway.'],['2005','Leonardo Notarbartolo is sentenced to ten years in prison.']],
   forensics:'The dumped rubbish included documents and a half-eaten sandwich that yielded DNA, linking members of the gang to the crime.',
   outcome:'Several members of the gang were convicted; the diamonds were never recovered.',
   sources:[['Wikipedia: Antwerp diamond heist','https://en.wikipedia.org/wiki/Antwerp_diamond_heist']]},

  {id:'hinterkaifeck', ll:[48.58,11.33], no:12, title:'The Hinterkaifeck murders', aka:'', country:'Germany', place:'Bavaria', year:1922, type:'Murder', status:'Unsolved', tags:['trace'],
   summary:'All six people living on a remote Bavarian farmstead, including two children and a maid on her first day, were killed with a mattock. In the days before, the farmer had reported footprints in the snow leading to the farm, but none leading away.',
   timeline:[['Mar 1922','The household reports footprints, a missing key and noises from the attic.'],['31 Mar 1922','The six are murdered.'],['4 Apr 1922','The bodies are discovered.']],
   forensics:'Investigators had little to work with by modern standards. The victims\' skulls were sent to Munich, where they were later lost during the Second World War.',
   outcome:'Many people were questioned over the decades; no one was ever charged.',
   sources:[['Wikipedia: Hinterkaifeck murders','https://en.wikipedia.org/wiki/Hinterkaifeck_murders']]},

  {id:'chicago-tylenol-murders', ll:[41.88,-87.63], no:13, title:'The Chicago Tylenol murders', aka:'', country:'United States', place:'Chicago area, Illinois', year:1982, type:'Poisoning', status:'Unsolved', tags:['toxicology','trace'],
   summary:'Seven people in the Chicago area died after taking Extra-Strength Tylenol capsules that had been laced with potassium cyanide and returned to store shelves.',
   timeline:[['29 Sep 1982','The first deaths occur.'],['Oct 1982','Tylenol is recalled nationwide, about 31 million bottles.'],['1983','The US passes a federal law against tampering with consumer products.']],
   forensics:'Toxicology identified cyanide in the victims and the capsules. Lot numbers showed the bottles came from different factories, pointing to tampering after they reached stores.',
   outcome:'No one has been charged with the murders. The case led to tamper-evident packaging worldwide.',
   sources:[['Wikipedia: Chicago Tylenol murders','https://en.wikipedia.org/wiki/Chicago_Tylenol_murders']]}
];
