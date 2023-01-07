 

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

  const volumeList1 = [{url: "./mni152.nii.gz"}]
  const nv1 = new niivue.Niivue({
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