# afNiiVue

afNiiVue is a cross-platform electron wrapper for the [NiiVue](https://github.com/niivue/niivue) web viewer. While web tools can work on any device (computer, phone, tablet) they must abide by strict security restrictions. For example, they are unable to load and save local files or listen to communication between applications. afNiiVue provides the power of a desktop application and is designed to communicate with [AFNI](https://afni.nimh.nih.gov/about_afni) tools.

This repository is currently a proof-of-concept, with limited functionality.

### Developing afNiiVue

afNiiVue development uses git versioning and the [node package manager](https://www.npmjs.com/) (npm). You can launch the software with the commands:


The first time you develop with afNiiVue you will need to install all the niivue dependencies and minify the core niivue modules:

```
git clone https://github.com/niivue/afNiiVue.git
cd afNiiVue
cd niivue
npm install
cd run demo
<CTRL-C to stop server>
cd ..
npm install
npm start
```

Subsequently, you can start developing by just calling `npm start` from the afNiiVue root folder.


Be aware that afNiiVue currently uses the `thresholding` branch of NiiVue, rather than the stable current release. This was added with

```
git submodule add -b thresholding https://github.com/niivue/niivue
```