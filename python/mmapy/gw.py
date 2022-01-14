import numpy as np
import json,string,os
from astropy import units as u
from astropy import constants as const
from matplotlib import pyplot as plt
from matplotlib import cm
import pandas as pd

def d2r(d):
    # convert degree to radians
    return(d/180.*np.pi)

def lb2vec(loc):
    """
    Convert lon,lat to unit vector
    Input: [list] 2-element list containing [longitude,latitude] (in degrees)
    Output: [lest] unit vector
    """
    vec=np.array([np.cos(d2r(loc[0]))*np.cos(d2r(loc[1])),
        np.sin(d2r(loc[0]))*np.cos(d2r(loc[1])),
        np.sin(d2r(loc[1]))])
    return vec
        
def rotate(lon,lat,ang):
    # create rotation matrix from (1,0,0) to lon,lat,ang)
    # NOT USED
    angrot=np.array([[1,0,0],[0,np.cos(d2r(ang)),-np.sin(d2r(ang))],[0,np.sin(d2r(ang)),np.cos(d2r(ang))]])
    lonrot=np.array([[np.cos(d2r(lon)),-np.sin(d2r(lon)),0],[np.sin(d2r(lon)),np.cos(d2r(lon)),0],[0,0,1]])
    latrot=np.array([[np.cos(d2r(-lat)),0,np.sin(d2r(-lat))],[0,1,0],[-np.sin(d2r(-lat)),0,np.cos(d2r(-lat))]])
    matrot=np.matmul(np.matmul(lonrot,latrot),angrot)
    return matrot

def vec2dt(vec,d1vec,d2vec):
    return((np.dot(vec,d2vec-d1vec))*const.R_earth/const.c)

def lbvec2dt(lon,lat,d1,d2):
    d1vec=lb2vec(d1['loc'])
    d2vec=lb2vec(d2['loc'])
    vec=lb2vec([lon,lat])
    return((np.dot(vec,d2vec-d1vec))*const.R_earth/const.c)
    
class Detector(object):
    def __init__(self,paramin):
        self.name=paramin.get('name','')
        self.code=paramin.get('code','')
        self._setloc(paramin)
        self.vec=self.tovec()
        return
    
    def _setloc(self,paramin):
        if 'loc' in paramin:
            self.loc=paramin['loc']
        elif 'lon' in paramin and 'lat' in paramin:
            self.loc=[paramin['lon'],paramin['lat']]
        else:
            self.loc=[]
        assert len(self.loc)==2, 'ERROR: non-valid location: {}'.format(self.loc)
        self.lon=self.loc[0]
        self.lat=self.loc[1]
        return 
    
    def tovec(self):
        # convert a lon,lat pair to a unit vector
        vec=np.array([np.cos(d2r(self.lon))*np.cos(d2r(self.lat)),
            np.sin(d2r(self.lon))*np.cos(d2r(self.lat)),
            np.sin(d2r(self.lat))])
        return vec

class DetectorPair(object):
    def __init__(self,d1,d2):
        assert isinstance(d1,Detector),'d1 is not of type Detector: {}'.format(type(d1))
        assert isinstance(d2,Detector),'d2 is not of type Detector: {}'.format(type(d2))
        self.code=d1.code+d2.code
        self.name='{}-{}'.format(d1.name,d2.name)
        self.d1=d1
        self.d2=d2
        self.sep=self.getsep()
        self.vec=self.getvec()
        return
    
    def getsep(self):
        dvec=self.d2.vec-self.d1.vec
        return(np.sqrt(dvec.dot(dvec))*const.R_earth.to('km'))
    
    def getvec(self):
        return(self.d2.vec-self.d1.vec)
        
    def vec2dt(self,vec):
        return((np.dot(vec,self.vec))*const.R_earth/const.c)
        
    def dtData(self,grid=15,csvFile='',units='ms',decimals=2,overwrite=False,verbose=False):
        recalc=True
        if hasattr(self,'dtarr'):
            dtobj=self.dtarr
            if overwrite:
                recalc=True
                if verbose:print('overwriting dt array for {} with grid {}'.format(self.code,grid))
            else:
                try:
                    if grid!=dtobj['grid']:
                        recalc=True
                        print('WARNING: existing grid [] does not match requested grid []. Recalculating'.format(dtobj['grid'],grid))
                    else:
                        recalc=False
                        if verbose:print('using existing dt array for {}'.format(self.code))
                except:
                    recalc=True
                    print('WARNING: unable to compare existing grid [] with requested grid []. Recalculating'.format(dtobj['grid'],grid))
            dtarr=dtobj['arr']
            gridsize=[dtobj['grid'],dtobj['grid']]
        if recalc:
            if verbose:print('calculating dt array for {} with grid {}'.format(self.code,grid))
            gridsize=[grid,grid]
            
            nRA=int(360/gridsize[0])
            nDec=int(180/gridsize[1])
            gridRAim=np.arange(gridsize[0]/2,360,gridsize[0])
            gridDecim=np.arange(90-gridsize[1]/2,-90,-gridsize[1])
            dtarr=np.zeros([nDec,nRA])
            
            for r in range(nRA):
                for d in range(nDec):
                    # get vector for sky localisation
                    vec=lb2vec([gridRAim[r],gridDecim[d]])
                    # dt = vec . (d1-d1) * R_earth / c
                    dt=self.vec2dt(vec)
                    dtarr[d,r]=dt.to(units).value
                    
            if np.max(dtarr)<=15:
                dt_res=2
            elif np.max(dtarr)<50:
                dt_res=5
            
            cmin=np.floor(np.min(dtarr)/dt_res)*dt_res
            cmax=np.ceil(np.max(dtarr)/dt_res)*dt_res
            clev=2*cmax/dt_res
            cticks=np.linspace(cmin,cmax,int(clev+1))
            
            dtobj={'arr':dtarr,'grid':grid,'dt_res':dt_res,'cticks':cticks,'units':units}
            self.dtarr=dtobj
            
        if csvFile:
            nRA=int(360/gridsize[0])
            nDec=int(180/gridsize[1])
            dtcsv=np.zeros([nDec,nRA])
            for r in range(nRA):
                for d in range(nDec):
                    dtcsv[d,r]=np.around(dtarr[d,r],decimals=decimals)
            df=pd.DataFrame(dtcsv)
            if verbose:print('saving dt array for {} to {}'.format(self.code,csvFile))
            df.to_csv(csvFile,header=False,index=False)
        
        return(dtobj)
        
    def getGridLocs(self,vec):
        dtobj=self.dtData()
        dtval=self.vec2dt(vec).to(dtobj['units']).value
        cticks=dtobj['cticks']
        for c in range(len(cticks)-1):
            if cticks[c]<=dtval and cticks[c+1]>=dtval:
                cmin=cticks[c]
                cmax=cticks[c+1]
        raStr=string.ascii_uppercase[:24]
        decStr=[str(x) for x in np.arange(12) + 1]
        decStr.reverse()
        (nDec,nRA)=np.shape(dtobj['arr'])
        print(nRA,nDec,len(raStr),len(decStr))
        cells=[]
        matchmap=np.zeros_like(dtobj['arr'])
        for r in range(nRA):
            for d in range(nDec):
                cellval=dtobj['arr'][d,r]
                if cellval>=cmin and cellval<=cmax:
                    matchmap[d,r]=1
                    cells.append(raStr[r]+decStr[d])
        return(matchmap,cells)
        
    def plotdtMap(self,grid=15,pngFile='',fignum=None,units='ms',colormap='jet',verbose=False):
        if np.isscalar(grid):
            gridsize=[grid,grid]
        else:
            gridsize=[grid[0],grid[1]]
        
        nRA=int(360/gridsize[0])
        nDec=int(180/gridsize[1])
        dtarr=self.dtData(grid=grid,units=units,verbose=verbose)
        
        labgridRA=np.arange(0,360+gridsize[0],gridsize[0])
        labgridDec=np.arange(-90,90+gridsize[1],gridsize[1])
            
        fig=plt.figure(fignum)
        plt.clf()
        
        # set colour levels
        cticks=dtarr['cticks']
        clev=len(cticks)-1
        cmin=cticks[0]
        cmax=cticks[-1]
        cmap=cm.get_cmap(colormap,clev)
        
        dRAgrid=nRA/24
        dDecgrid=nDec/12
        plt.imshow(dtarr['arr'],aspect='equal',cmap=cmap,vmin=cmin,vmax=cmax)
        ax=plt.gca()
        ax.set_aspect('equal')
        # add ticks and labels
        ax.set_xticks(np.arange(0,nRA,dRAgrid)-0.5,['']*24)
        ax.set_xticks(np.arange(np.max([0,(dRAgrid-1)/2]),nRA,dRAgrid),
            string.ascii_uppercase[:24],minor=True)
        ax.set_yticks(np.arange(0,nDec,dDecgrid)-0.5,['']*12)
        yticklabs=[str(x) for x in np.arange(12) + 1]
        yticklabs.reverse()
        ax.set_yticks(np.arange(np.max([0,(dDecgrid-1)/2]),nDec,dDecgrid),
            yticklabs,minor=True)
        ax.tick_params(axis='both',which='minor',length=0)
        
        ax.set_aspect('equal')
        plt.title('Time Difference: {}'.format(self.name))
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='Time difference ({})'.format(units),ticks=cticks)
        # pngFile=os.path.join(plotDir,'dt_contour_{}.png'.format(dd))
        if pngFile:
            if verbose:print('saving dt map for {} to {}'.format(self.code,pngFile))
            plt.savefig(pngFile)

        return(fig)
    
    def plotdtMapContour(self,grid=15,pngFile='',fignum=None,units='ms',colormap='jet',verbose=False):
        gridsize=[grid,grid]
        
        # use contour plot
        # set grid for contour plot - on gridlines, including final line
        nRA=int(360/gridsize[0])+1
        nDec=int(180/gridsize[1])+1
        gridRA=np.arange(0,360+gridsize[0],gridsize[0])
        gridDec=np.arange(-90,90+gridsize[1],gridsize[1])
        
        dtarr=np.zeros([nDec,nRA])
        for r in range(nRA):
            for d in range(nDec):
                # get vector for sky localisation
                vec=lb2vec([gridRA[r],gridDec[d]])
                # dt = vec . (d1-d1) * R_earth / c
                dt=self.vec2dt(vec)
                dtarr[d,r]=dt.to(units).value    
            
        fig=plt.figure(fignum)
        plt.clf()
        
        # set colour levels
        if np.max(dtarr)<=15:
            dcol=2
        elif np.max(dtarr)<50:
            dcol=5
        cmin=np.floor(np.min(dtarr)/dcol)*dcol
        cmax=np.ceil(np.max(dtarr)/dcol)*dcol
        clev=2*cmax/dcol
        cmap=cm.get_cmap(colormap,clev)
        cticks=np.linspace(cmin,cmax,int(clev+1))
        
        labgridsize=[15,15]
        labgridRA=np.arange(0,360+labgridsize[0],labgridsize[0])
        labgridDec=np.arange(-90,90+labgridsize[1],labgridsize[1])
        
        plt.contourf(gridRA,gridDec,dtarr,cmap=cmap,vmin=cmin,vmax=cmax,levels=cticks)
        ax=plt.gca()
        # add ticks and labels
        ax.set_xticks(labgridRA,['']*len(labgridRA))
        ax.set_xticks(labgridRA[:-1]+labgridsize[0]/2,
            string.ascii_uppercase[:len(labgridRA)-1],minor=True)
        ax.set_yticks(labgridDec,['']*len(labgridDec))
        ax.set_yticks(labgridDec[:-1]+labgridsize[1]/2,
            [str(x) for x in np.arange(len(labgridDec)-1) + 1],minor=True)
        ax.tick_params(axis='both',which='minor',length=0)
    
        ax.set_aspect('equal')
        plt.title('Time Difference: {}'.format(self.name))
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='Time difference ({})'.format(units),ticks=cticks)
        # pngFile=os.path.join(plotDir,'dt_contour_{}.png'.format(dd))
        if pngFile:
            if verbose:print('saving dt map for {} to {}'.format(self.code,pngFile))
            plt.savefig(pngFile)

        return(fig)
    
class EventGW(object):
    def __init__(self,parent,detectors={}):
        self.parent=parent
        self.detlist=parent.initParams.get('gw_dets',[])
        self.loc=parent.loc
        self.name=parent.name
        self.chirpmass_Msun=parent.initParams.get('chirpmass_Msun',None)
        self.setGwDets(detectors)
        return
        
    def gridLoc(self):
        """
        Set location of event, centred on 15deg grid squares
        Inputs: None
        Output: [float,float]: [lon,lat]
        """
        grid=15.
        gridlon=np.floor(self.loc[0]/grid)*grid + grid/2
        gridlat=np.floor(self.loc[1]/grid)*grid + grid/2
        return [gridlon,gridlat]
    
    def setGwDets(self,detsIn):
        """
        Add detector info to EventGW, based on detector list in Event, and using Detector info provided.
        Attributes added:
          * cell: [string] cell name of event
          * matcharr: [numpy.array] RA,Dec grid of number of detector pairs that match each cell
          * cellmatches: [list] List of cells that are matched by all detector pairs
        Inputs:
          * [dict]: dictionary containing Detector objects for detectors
        Output: None
        """
        self.gridloc=self.gridLoc()
        gridvec=lb2vec(self.gridloc)
        self.detectors={}
        for d in self.detlist:
            if d in detsIn:
                self.detectors[d]=detsIn[d]
                print('adding detector {}'.format(d))
        self.detpairs=dets2pairs(self.detectors)
        self.dt={}
        raStr=string.ascii_uppercase[:24]
        decStr=[str(x) for x in np.arange(12) + 1]
        decStr.reverse()
        self.cell=raStr[int(self.gridloc[0]/15)]+decStr[int((90-self.gridloc[1])/15)]
        print('\n\n\n',self.name,self.loc,self.gridloc,self.gridloc[0]/15,(self.gridloc[1]+90)/15,self.cell)
        dplist=[]
        for dd in self.detpairs:
            dtobj={}
            detp=self.detpairs[dd]
            dtobj['arr']=detp.dtData()
            dtobj['value']=detp.vec2dt(gridvec).to(dtobj['arr']['units']).value
            
            dtobj['matchmap'],dtobj['cells']=detp.getGridLocs(gridvec)
            self.dt[dd]=dtobj
            
            print(dd,dtobj['value'])
            print(dtobj['cells'])
            
        cellmatches=[]
        npair=len(self.dt)
        matcharr=np.zeros_like(dtobj['arr']['arr'])
        for dd in self.detpairs:
            matcharr=matcharr+self.dt[dd]['matchmap']
        for r in range(len(raStr)):
            for d in range(len(decStr)):
                if matcharr[d,r]==npair:
                    cellmatches.append(raStr[r]+decStr[d])
        self.matcharr=matcharr
        
        self.cellmatches=cellmatches
        print('cell matches:',self.cellmatches)
        return

    def plotmatches(self,plotDir=''):
        """
        Plot grid of matches for each cell
        Inputs:
          * plotDir: [string, optional] directory to output image to. Default=''
        Output: none
        """
        matcharr=self.matcharr
        
        (nDec,nRA)=np.shape(matcharr)
        dRAgrid=nRA/24
        dDecgrid=nDec/12
        
        plt.figure()
        plt.clf()
        plt.imshow(matcharr)
        ax=plt.gca()
        ax.set_aspect('equal')
        ax.set_xticks(np.arange(0,nRA,dRAgrid)-0.5,['']*24)
        ax.set_xticks(np.arange(np.max([0,(dRAgrid-1)/2]),nRA,dRAgrid),
            string.ascii_uppercase[:24],minor=True)
        ax.set_yticks(np.arange(0,nDec,dDecgrid)-0.5,['']*12)
        yticklabs=[str(x) for x in np.arange(12) + 1]
        yticklabs.reverse()
        ax.set_yticks(np.arange(np.max([0,(dDecgrid-1)/2]),nDec,dDecgrid),
            yticklabs,minor=True)
        ax.tick_params(axis='both',which='minor',length=0)
        plt.title('Matching time differences: {}'.format(self.name))
        
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='N matches')
        
        plt.savefig(os.path.join(plotDir,'{}_matchcells.png'.format(self.name)))
        return
        
def readDetectors(fileIn):
    if isinstance(fileIn,str):
        dataIn=json.load(open(fileIn))
    else:
        dataIn=fileIn
    if 'detectors' in dataIn:
        detsIn=dataIn['detectors']
    else:
        detsIn=dataIn
    
    # detlist=[]
    dets={}
    for d in detsIn:
        # detlist.append(d)
        dets[d]=Detector(detsIn[d])
    
    return(dets)

def dets2pairs(dets):
    pairs={}
    for d1 in dets:
        for d2 in dets:
            if d1>d2:
                pair=DetectorPair(dets[d1],dets[d2])
                pairs[pair.code]=pair
    return(pairs)

def readDetPairs(fileIn):
    
    dets=readDetectors(fileIn)
    pairs=dets2pairs(dets)
    return(pairs)

def plotMaps(detpairs,grid=15,plotDir='',dataDir='',
            fignum=None,units='ms',colormap='jet',plottype='imshow',verbose=False,pngPrefix='',csvPrefix=''):
    allowedtypes=['contour','imshow']
    assert plottype in allowedtypes,'ERROR: INVALID PLOTTYPE [{}]'.format(plottype)
        
    p=0
    for dd in detpairs:
        if verbose:print('plotting dt map for {} [type={}, grid={}]'.format(detpairs[dd].code,plottype,grid))
        p=p+1
        csvFile=os.path.join(dataDir,'{}dt_{}.csv'.format(csvPrefix,detpairs[dd].code))
        if plottype=='contour':
            pngFile=os.path.join(plotDir,'{}dt_{}_contour.png'.format(pngPrefix,detpairs[dd].code))
            detpairs[dd].plotdtMapContour(pngFile=pngFile,fignum=p,units=units,colormap=colormap,verbose=verbose,grid=grid)
        else:
            pngFile=os.path.join(plotDir,'{}dt_{}.png'.format(pngPrefix,detpairs[dd].code))
            detpairs[dd].dtData(csvFile=csvFile,verbose=verbose)
            detpairs[dd].plotdtMap(pngFile=pngFile,fignum=p,units=units,colormap=colormap,verbose=verbose,grid=grid)
    plt.show()
    

