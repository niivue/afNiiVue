  const root = "./niivue/demos/images/"
  var ipcRenderer = require('electron').ipcRenderer;
  var isFilled = true;
  ipcRenderer.on('addDrawing', async function (evt, message) {
    if (message.length < 1) return;
    let ok = await nv1.loadDrawingFromUrl(message[0]);
    if (!ok)
      alert("No drawing loaded. Make sure drawing matches dimensions of background image.");
  });
  ipcRenderer.on('closeAll', async function (evt, message) {
    nv1.volumes = [];
    nv1.overlays = [];
    nv1.meshes = [];
    nv1.closeDrawing();
    nv1.drawScene();
  });
  ipcRenderer.on('addFiles', async function (evt, message) {
    if (message.length < 1) return;
    var volumeList = [];
    var meshList = [];
    for (let i = 0; i < message.length; i++) {
      let v = {url: message[i]};
      if (nv1.isMeshExt(message[i])) {
        meshList.push(v);
        continue;
      }
      volumeList.push (v);
    }
    if (volumeList.length > 0)
      await nv1.loadVolumes(volumeList);
    if (meshList.length > 0)
      await nv1.loadMeshes(meshList);
  });
  ipcRenderer.on('setSliceType', async function (evt, message) {
    nv1.setSliceType(message);
  });
  ipcRenderer.on('showColorbar', async function (evt, message) {
    nv1.opts.isColorbar = message;
    nv1.drawScene();
  });
  ipcRenderer.on('setRadiological', async function (evt, message) {
    nv1.opts.isRadiologicalConvention = message
    nv1.drawScene()
  });
  ipcRenderer.on('setClipPlane', async function (evt, message) {
    if (message)
      nv1.setClipPlane([0.3, 270, 0])
    else
      nv1.setClipPlane([2, 270, 0])
    nv1.drawScene()
  });
  ipcRenderer.on('setDarkBackground', async function (evt, message) {
    if (message)
      nv1.opts.backColor = [0, 0, 0, 1]
    else
      nv1.opts.backColor = [1, 1, 1, 1]
    nv1.drawScene()
  });
  ipcRenderer.on('setPenColor', async function (evt, message) {
    if (message === "Off")
        nv1.setDrawingEnabled(false)
    else
        nv1.setDrawingEnabled(true)
    if (message === "Erase")
        nv1.setPenValue(0, isFilled);
    if (message === "Red")
        nv1.setPenValue(1, isFilled);
    if (message === "Green")
        nv1.setPenValue(2, isFilled);
    if (message === "Blue")
        nv1.setPenValue(3, isFilled);
    if (message === "EraseCluster")
      nv1.setPenValue(-0, isFilled);
  });
  ipcRenderer.on('setDrawFilled', async function (evt, message) {
    isFilled = message;
    nv1.setPenValue(nv1.opts.penValue, isFilled);
  });
  ipcRenderer.on('setDrawOverwrite', async function (evt, message) {
    nv1.drawFillOverwrites = message;
  });
  ipcRenderer.on('setDrawTranslucent', async function (evt, message) {
    if (message)
      nv1.drawOpacity = 0.5
    else
      nv1.drawOpacity = 1.0;
    nv1.drawScene()
  });
  ipcRenderer.on('drawOtsu', async function (evt, message) {
    nv1.drawOtsu(message); //numeric: 2,3,4
  });
  ipcRenderer.on('drawGrowCut', async function (evt, message) {
    nv1.drawGrowCut();
  });
  ipcRenderer.on('drawUndo', async function (evt, message) {
    nv1.drawUndo();
  });
  ipcRenderer.on('drawSave', async function (evt, message) {
    if (!nv1.drawBitmap)
      alert("No drawing loaded. Open or create a drawing.");
    else
      nv1.saveImage(message, true) //message is file path
  });
  ipcRenderer.on('moveCrosshair', async function (evt, message) {
    if (message === "L")
      nv1.moveCrosshairInVox(-1, 0, 0);
    if (message === "R")
      nv1.moveCrosshairInVox(1, 0, 0);
    if (message === "P")
      nv1.moveCrosshairInVox(0, -1, 0);
    if (message === "A")
      nv1.moveCrosshairInVox(0, 1, 0);
    if (message === "I")
      nv1.moveCrosshairInVox(0, 0, -1);
    if (message === "S")
      nv1.moveCrosshairInVox(0, 0, 1);
  });
  ipcRenderer.on('setDragType', async function (evt, message) {
    switch(message) {
     case "dragNone":
       nv1.opts.dragMode = nv1.dragModes.none
       break
     case "dragContrast":
       nv1.opts.dragMode = nv1.dragModes.contrast
       break
     case "dragMeasure":
       nv1.opts.dragMode = nv1.dragModes.measurement
       break
     case "dragPan":
       nv1.opts.dragMode = nv1.dragModes.pan
       break
   }
  });
  ipcRenderer.on('doStandard', async function (evt, message) {
    //close open files
    nv1.volumes = [];
    nv1.overlays = [];
    nv1.meshes = [];
    nv1.closeDrawing();
    nv1.updateGLVolume();
    let img = root + message + '.nii.gz'
    let volumeList1 = [{url: img}];
    if (message === "overlay") {
     volumeList1 = [
         {
           url: root+"fslmean.nii.gz",
           colorMap: "gray",
           opacity: 1,
           visible: true,
         },
         {
           url: root+"fslt.nii.gz",
           colorMap: "warm",
           colorMapNegative: "winter",
           opacity: 1,
           cal_min: 1,
           cal_max: 6,
           visible: true,
         },
      ]
      nv1.loadVolumes(volumeList1)
    } else if (message === "mesh") {
      volumeList1[0].url = root + 'mni152' + '.nii.gz'
      await nv1.loadVolumes(volumeList1)
      nv1.loadMeshes([
              {url: root+"BrainMesh_ICBM152.lh.mz3", rgba255 : [200, 162, 255, 255]},
              {url: root+"dpsv.trx", rgba255 : [255, 255, 255, 255]},
          ])
    } else 
      nv1.loadVolumes(volumeList1)
    nv1.updateGLVolume();
  });
  ipcRenderer.on('setWorldSpace', async function (evt, message) {
    nv1.setSliceMM(message);
  });
  ipcRenderer.on('setSmooth', async function (evt, message) {
    nv1.setInterpolation(!message);
  });
  function handleIntensityChange(data){ 
    function flt2str(flt, decimals = 0) {
      return flt.toFixed(decimals).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1')
    }
    let str = " = ";
    if (data.hasOwnProperty('values')) //e.g. a mesh with no voxels will have no values
        for (let i = 0; i < data.values.length; i++) 
        str += flt2str(data.values[i].value, 3) + "   "
    document.getElementById('intensity').innerHTML = '&nbsp;&nbsp;'+flt2str(data.mm[0])+'×'+flt2str(data.mm[1])+'×'+flt2str(data.mm[2])+str    
  }
  var volumeList1 = [{url: root+"/mni152.nii.gz"}]
  //var volumeList1 = [{url: "./images/FLAIR.nii.gz"}]
  var nv1 = new niivue.Niivue({
      dragAndDropEnabled: true,
      show3Dcrosshair: true,
      onLocationChange:handleIntensityChange
  })
  nv1.setRadiologicalConvention(false)
  nv1.opts.multiplanarForceRender = true
  nv1.graph.autoSizeMultiplanar = true
  nv1.graph.opacity = 1.0
  nv1.attachTo('gl1')
  await nv1.loadVolumes(volumeList1)
  nv1.setSliceType(nv1.sliceTypeMultiplanar)