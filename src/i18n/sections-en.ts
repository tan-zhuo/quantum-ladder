/**
 * 教材小节标题的英文对照。
 *
 * 只翻标题与章节元数据，**不翻正文**：106 节的完整推导要认真译一遍是另一个量级的
 * 工作量，草率机翻会毁掉这部分内容的可信度。所以英文版的定位很明确——
 * 3D 模块（平台主轴）完整英文，教材部分给出可导航的英文目录，正文仍是中文，
 * 并在入口处如实标注。
 */
export const SECTION_TITLES_EN: Record<string, string> = {
  '00-guide/01-index': 'How to use this site',

  '01-history/01-classical-crisis': 'The crisis of classical physics',
  '01-history/02-blackbody-planck': 'Black-body radiation and Planck’s quantum hypothesis',
  '01-history/03-photoelectric-effect': 'The photoelectric effect and Einstein’s light quanta',
  '01-history/04-bohr-model': 'The Bohr model and the correspondence principle',
  '01-history/05-de-broglie': 'De Broglie and wave–particle duality',
  '01-history/06-double-slit': 'The double slit, told in full',
  '01-history/07-uncertainty-origins': 'Where the uncertainty principle came from',

  '02-wavefunction/01-born-rule': 'The probability interpretation of the wavefunction',
  '02-wavefunction/02-normalization-and-current': 'Normalisation and probability current',
  '02-wavefunction/03-time-independent-schrodinger': 'The time-independent Schrödinger equation',
  '02-wavefunction/04-time-dependent-schrodinger': 'The time-dependent Schrödinger equation',
  '02-wavefunction/05-stationary-states': 'Stationary and non-stationary states',
  '02-wavefunction/06-expectation-and-uncertainty':
    'Expectation values, variance and the uncertainty principle',
  '02-wavefunction/07-infinite-well': 'The one-dimensional infinite square well',
  '02-wavefunction/08-finite-well': 'The one-dimensional finite square well',
  '02-wavefunction/09-harmonic-oscillator': 'The harmonic oscillator',
  '02-wavefunction/10-free-particle': 'Free particles and Gaussian wave packets',
  '02-wavefunction/11-tunneling': 'Barrier penetration and tunnelling',

  '03-formalism/01-from-wavefunction-to-vector': 'From wavefunctions to state vectors',
  '03-formalism/02-dirac-notation': 'Dirac notation, in full',
  '03-formalism/03-hilbert-space': 'Hilbert space: the essentials',
  '03-formalism/04-linear-operators': 'Linear operators and eigenvalue problems',
  '03-formalism/05-hermitian-operators': 'Hermitian operators and observables',
  '03-formalism/06-commutators': 'Commutators and the generalised uncertainty principle',
  '03-formalism/07-postulates': 'The postulates of quantum mechanics',
  '03-formalism/08-measurement': 'Measurement and the projection postulate',
  '03-formalism/09-time-evolution-pictures': 'Time-evolution operators and pictures',
  '03-formalism/10-density-operator': 'Introducing the density operator',
  '03-formalism/11-rewrite-exercises': 'Rewriting earlier chapters in Dirac notation',

  '04-1d-problems/01-symmetry-parity': 'Symmetry and parity',
  '04-1d-problems/02-scattering-phase-shift': 'Scattering states and phase shifts',
  '04-1d-problems/03-transfer-matrix': 'The transfer-matrix method',
  '04-1d-problems/04-finite-difference': 'Solving the Schrödinger equation numerically',
  '04-1d-problems/05-custom-potential-solver': 'A solver for arbitrary potentials',

  '05-angular-momentum/01-orbital-angular-momentum': 'Orbital angular-momentum operators',
  '05-angular-momentum/02-spherical-harmonics': 'Angular-momentum eigenvalues and spherical harmonics',
  '05-angular-momentum/03-spin-half': 'Spin 1/2 and the Pauli matrices',
  '05-angular-momentum/04-stern-gerlach': 'The Stern–Gerlach experiment in depth',
  '05-angular-momentum/05-spin-precession': 'Spin precession',
  '05-angular-momentum/06-clebsch-gordan': 'Adding angular momenta and Clebsch–Gordan coefficients',
  '05-angular-momentum/07-spin-orbit': 'Spin–orbit coupling',

  '06-hydrogen/01-central-force': 'Reducing the central-force problem',
  '06-hydrogen/02-radial-equation': 'The radial equation and the effective potential',
  '06-hydrogen/03-hydrogen-solution': 'The complete solution for hydrogen',
  '06-hydrogen/04-energy-levels': 'Levels, degeneracy and quantum numbers',
  '06-hydrogen/05-orbital-visualization': 'The spatial distribution of probability density',
  '06-hydrogen/06-fine-structure': 'Fine structure',
  '06-hydrogen/07-zeeman-stark': 'The Zeeman and Stark effects',

  '07-approximation/01-nondegenerate-perturbation': 'Non-degenerate perturbation theory',
  '07-approximation/02-degenerate-perturbation': 'Degenerate perturbation theory',
  '07-approximation/03-variational-method': 'The variational method',
  '07-approximation/04-wkb': 'The WKB approximation',
  '07-approximation/05-time-dependent-perturbation': 'Time-dependent perturbation theory',
  '07-approximation/06-fermi-golden-rule': 'Fermi’s golden rule',
  '07-approximation/07-berry-phase': 'The adiabatic theorem and the Berry phase',
  '07-approximation/08-sudden-approximation': 'The sudden approximation',

  '08-identical-particles/01-identity-principle': 'The principle of indistinguishability',
  '08-identical-particles/02-bosons-fermions': 'Bosons and fermions',
  '08-identical-particles/03-pauli-exclusion': 'The Pauli exclusion principle',
  '08-identical-particles/04-exchange-interaction': 'Exchange interaction and its spectral effects',
  '08-identical-particles/05-second-quantization': 'An introduction to second quantisation',
  '08-identical-particles/06-hartree-fock': 'The Hartree–Fock idea',
  '08-identical-particles/07-reduced-density-matrix':
    'Reduced density matrices and a first look at entanglement',

  '09-quantum-information/01-qubit-bloch-sphere': 'Qubits and the Bloch sphere',
  '09-quantum-information/02-quantum-gates': 'One- and two-qubit gates',
  '09-quantum-information/03-entanglement-measures': 'Quantifying entanglement',
  '09-quantum-information/04-bell-chsh': 'Bell inequalities and CHSH',
  '09-quantum-information/05-teleportation': 'Quantum teleportation',
  '09-quantum-information/06-superdense-coding': 'Superdense coding',
  '09-quantum-information/07-deutsch-jozsa': 'The Deutsch–Jozsa algorithm',
  '09-quantum-information/08-grover': 'Grover’s search algorithm',
  '09-quantum-information/09-shor': 'The idea behind Shor’s algorithm',
  '09-quantum-information/10-error-correction': 'An introduction to quantum error correction',

  '10-open-systems/01-why-density-matrix': 'Why we need density matrices',
  '10-open-systems/02-mixed-states': 'Mixed states and the shrinking Bloch sphere',
  '10-open-systems/03-cptp-maps': 'Quantum operations and CPTP maps',
  '10-open-systems/04-lindblad': 'The Lindblad master equation',
  '10-open-systems/05-decoherence': 'The physical picture of decoherence',
  '10-open-systems/06-quantum-darwinism': 'A short introduction to quantum Darwinism',

  '11-path-integral/01-path-integral-idea': 'Feynman’s path-integral idea',
  '11-path-integral/02-propagator': 'The propagator',
  '11-path-integral/03-to-schrodinger': 'From the path integral to the Schrödinger equation',
  '11-path-integral/04-instantons': 'Instantons and tunnelling',

  '12-relativistic/01-why-relativistic': 'Why relativistic quantum mechanics is needed',
  '12-relativistic/02-klein-gordon': 'The Klein–Gordon equation',
  '12-relativistic/03-dirac-equation': 'The Dirac equation',
  '12-relativistic/04-antiparticles': 'Antiparticles and the Dirac sea',
  '12-relativistic/05-spin-relativity': 'Why spin follows from relativity',

  '13-frontier/01-topological-matter': 'Quantum mechanics in topological matter',
  '13-frontier/02-cold-atoms': 'Ultracold atoms and optical lattices',
  '13-frontier/03-cqed-superconducting': 'Cavity QED and superconducting qubits',
  '13-frontier/04-quantum-simulation': 'Quantum simulation',
  '13-frontier/05-fault-tolerance': 'Fault tolerance and progress on the surface code',
  '13-frontier/06-quantum-thermodynamics': 'Quantum thermodynamics and quantum batteries',
  '13-frontier/07-foundations':
    'Foundations: collapse, macroscopic realism and Wigner’s friend',
  '13-frontier/08-black-hole-information': 'The information problem in quantum gravity',
  '13-frontier/09-quantum-machine-learning': 'A short introduction to quantum machine learning',

  'appendix-a-math/01-linear-algebra': 'Linear algebra reference',
  'appendix-a-math/02-fourier': 'Fourier analysis reference',
  'appendix-a-math/03-special-functions': 'Special functions in common use',
  'appendix-b-formulas/01-formula-table': 'Formulae and constants',
  'appendix-c-numerics/01-finite-difference': 'Finite differences for stationary states',
  'appendix-c-numerics/02-split-operator': 'The split-operator method',
  'appendix-c-numerics/03-exact-diagonalization-mc': 'Exact diagonalisation and Monte Carlo',
  'appendix-d-resources/01-resources': 'Recommended reading and resources',
}

/** 章标题与一句话说明的英文对照，键是 chapters.ts 里的 id */
export const CHAPTER_EN: Record<string, { title: string; blurb: string }> = {
  '00-guide': {
    title: 'How to use this site',
    blurb: 'Three learning routes, notation conventions, and how to get value out of the simulations.',
  },
  '01-history': {
    title: 'History and physical pictures',
    blurb: 'From black-body radiation to delayed choice: build the intuition before the formalism.',
  },
  '02-wavefunction': {
    title: 'The wavefunction and the Schrödinger equation',
    blurb: 'The first computational toolkit: wavefunctions, eigenvalue problems, exact 1D solutions.',
  },
  '03-formalism': {
    title: 'Formalism: Dirac notation and the postulates',
    blurb: 'Abstracting wavefunctions into vectors in Hilbert space is where the theory takes shape.',
  },
  '04-1d-problems': {
    title: 'One-dimensional problems and numerical methods',
    blurb: 'Parity, phase shifts, transfer matrices — and writing your own Schrödinger solver.',
  },
  '05-angular-momentum': {
    title: 'Angular momentum and spin',
    blurb: 'Pure algebra fixes every eigenvalue: the prettiest derivation in the subject.',
  },
  '06-hydrogen': {
    title: 'Hydrogen and central forces',
    blurb: 'The first real three-dimensional system, and the starting point of all chemistry.',
  },
  '07-approximation': {
    title: 'Approximation methods',
    blurb: 'Almost nothing real is solvable. Perturbation theory, variation, WKB, golden rule, Berry phase.',
  },
  '08-identical-particles': {
    title: 'Identical particles and many-body basics',
    blurb: 'How exchange symmetry holds up the periodic table, metals and white dwarfs.',
  },
  '09-quantum-information': {
    title: 'Quantum information and computing',
    blurb: 'Quantum mechanics as a resource: entanglement, Bell inequalities, algorithms, error correction.',
  },
  '10-open-systems': {
    title: 'Open systems and decoherence',
    blurb: 'Why the world looks classical: density matrices, CPTP maps, Lindblad.',
  },
  '11-path-integral': {
    title: 'Path integrals and other formulations',
    blurb: 'A third equivalent formulation: sum over histories, with the classical limit falling out.',
  },
  '12-relativistic': {
    title: 'Relativistic quantum mechanics',
    blurb: 'Klein–Gordon and Dirac, and why spin is an inevitable consequence of relativity.',
  },
  '13-frontier': {
    title: 'Frontier topics',
    blurb: 'Topological matter, cold atoms, superconducting qubits, foundations — enter at any point.',
  },
  'appendix-a-math': {
    title: 'Mathematical reference',
    blurb: 'Linear algebra, Fourier analysis, special functions — come back when you need them.',
  },
  'appendix-b-formulas': {
    title: 'Formulae and constants',
    blurb: 'The source of the site-wide formula reference panel.',
  },
  'appendix-c-numerics': {
    title: 'Notes on numerical methods',
    blurb: 'The algorithms behind every simulation here: finite differences, exact diagonalisation, split-operator.',
  },
  'appendix-d-resources': {
    title: 'Further reading',
    blurb: 'Textbooks, lecture notes, papers, open-source projects and video courses.',
  },
}
