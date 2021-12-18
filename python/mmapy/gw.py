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
    
def lb2vec(lon,lat):
    # convert a lon,lat pair to a unit vector
    vec=np.array([np.cos(d2r(lon))*np.cos(d2r(lat)),
        np.sin(d2r(lon))*np.cos(d2r(lat)),
        np.sin(d2r(lat))])
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
    d1vec=lb2vec(d1['loc'][0],d1['loc'][1])
    d2vec=lb2vec(d2['loc'][0],d2['loc'][1])
    vec=lb2vec(lonlat)
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

def readDetPairs(fileIn):
    
    dets=readDetectors(fileIn)
    pairs={}
    for d1 in dets:
        for d2 in dets:
            if d1>d2:
                pair=DetectorPair(dets[d1],dets[d2])
                pairs[pair.code]=pair
    return(pairs)

def dtData(detpair,grid=15,csvFile='',units='ms',decimals=2):
    if np.isscalar(grid):
        gridsize=[grid,grid]
    else:
        gridsize=[grid[0],grid[1]]
    
    nRAim=int(360/gridsize[0])
    nDecim=int(180/gridsize[1])
    gridRAim=np.arange(gridsize[0]/2,360,gridsize[0])
    gridDecim=np.arange(90-gridsize[1]/2,-90,-gridsize[1])
    dtcsv=np.zeros([nDecim,nRAim])
    for r in range(nRAim):
        for d in range(nDecim):
            # get vector for sky localisation
            vec=lb2vec(gridRAim[r],gridDecim[d])
            # dt = vec . (d1-d1) * R_earth / c
            dt=detpair.vec2dt(vec)
            dtcsv[d,r]=np.around(dt.to(units).value,decimals=decimals)
    df=pd.DataFrame(dtcsv)
    if csvFile:
        df.to_csv(csvFile,header=False,index=False)

    return(df)

def dtMap(detpair,grid=15,pngFile='',plottype='imshow',fignum=None,units='ms',colormap='jet'):
    allowedtypes=['contour','imshow']
    assert plottype in allowedtypes,'ERROR: INVALID PLOTTYPE [{}]'.format(plottype)
    if np.isscalar(grid):
        gridsize=[grid,grid]
    else:
        gridsize=[grid[0],grid[1]]
    
    if plottype=="contour":
        # use contour plot
        # set grid for contour plot - on gridlines, including final line
        nRA=int(360/gridsize[0])+1
        nDec=int(180/gridsize[1])+1
        gridRA=np.arange(0,360+gridsize[0],gridsize[0])
        gridDec=np.arange(90,-90-gridsize[1],-gridsize[1])

        dtcont=np.zeros([nDec,nRA])
        for r in range(nRA):
            for d in range(nDec):
                # get vector for sky localisation
                vec=lb2vec(gridRA[r],gridDec[d])
                # dt = vec . (d1-d1) * R_earth / c
                dt=detpair.vec2dt(vec)
                dtcont[d,r]=dt.to(units).value
                
                
        labgridsize=[15,15]
        labgridRA=np.arange(0,360+labgridsize[0],labgridsize[0])
        labgridDec=np.arange(-90,90+labgridsize[1],labgridsize[1])
        
        fig=plt.figure(fignum)
        plt.clf()
        
        # set colour levels
        if np.max(maps[dd]['dtcont'])<=15:
            dcol=2
        elif np.max(maps[dd]['dtcont'])<50:
            dcol=5
        cmin=np.floor(np.min(dtcont)/dcol)*dcol
        cmax=np.ceil(np.max(dtcont)/dcol)*dcol
        clev=2*cmax/dcol
        cmap=cm.get_cmap(colormap,clev)
        cticks=np.linspace(cmin,cmax,int(clev+1))
        # print(dd,np.min(maps[dd]['dtcont']),np.max(maps[dd]['dtcont']),cmin,cmax,cticks)
        
        plt.contourf(gridRA,gridDec,dtcont,cmap=cmap,vmin=cmin,vmax=cmax,levels=cticks)
        ax=plt.gca()
        ax.set_aspect('equal')
        plt.title('Time Difference: {}'.format(detpair.name))
        
        # add ticks and labels
        ax.set_xticks(labgridRA,['']*len(labgridRA))
        ax.set_xticks(labgridRA[:-1]+labgridsize[0]/2,string.ascii_uppercase[:len(labgridRA)-1],minor=True)
        ax.set_yticks(labgridDec,['']*len(labgridDec))
        ax.set_yticks(labgridDec[:-1]+labgridsize[1]/2,range(len(labgridDec)-1),minor=True)
        ax.tick_params(axis='both',which='minor',length=0)

        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='Time difference ({})'.format(units),ticks=cticks)
        # pngFile=os.path.join(plotDir,'dt_contour_{}.png'.format(dd))
        if pngFile: plt.savefig(pngFile)
    else:
        # use imshow
        nRAim=int(360/gridsize[0])
        nDecim=int(180/gridsize[1])
        gridRAim=np.arange(gridsize[0]/2,360,gridsize[0])
        gridDecim=np.arange(90-gridsize[1]/2,-90,-gridsize[1])
        dtim=np.zeros([nDecim,nRAim])
        for r in range(nRAim):
            for d in range(nDecim):
                # get vector for sky localisation
                vec=lb2vec(gridRAim[r],gridDecim[d])
                # dt = vec . (d1-d1) * R_earth / c
                dt=detpair.vec2dt(vec)
                dtim[d,r]=dt.to(units).value
        dRAgrid=nRAim/24
        dDecgrid=nDecim/12
        
        fig=plt.figure(fignum)
        plt.clf()
        
        # set colour levels
        if np.max(dtim)<=15:
            dcol=2
        elif np.max(dtim)<50:
            dcol=5
        cmin=np.floor(np.min(dtim)/dcol)*dcol
        cmax=np.ceil(np.max(dtim)/dcol)*dcol
        clev=2*cmax/dcol
        cmap=cm.get_cmap('jet',clev)
        cticks=np.linspace(cmin,cmax,int(clev+1))
        
        plt.imshow(dtim,aspect='equal',cmap=cmap,vmin=cmin,vmax=cmax)
        ax=plt.gca()
        ax.set_aspect('equal')
        # add ticks and labels
        plt.title('Time Difference: {}'.format(detpair.name))
        ax.set_xticks(np.arange(0,nRAim,dRAgrid)-0.5,['']*24)
        ax.set_xticks(np.arange(np.max([0,(dRAgrid-1)/2]),nRAim,dRAgrid),string.ascii_uppercase[:24],minor=True)
        ax.set_yticks(np.arange(0,nDecim,dDecgrid)-0.5,['']*12)
        ax.set_yticks(np.arange(np.max([0,(dDecgrid-1)/2]),nDecim,dDecgrid),range(12),minor=True)
        ax.tick_params(axis='both',which='minor',length=0)
        
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='Time difference ({})'.format(units),ticks=cticks)
        # pngFile=os.path.join(plotDir,'dt_imshow_{}.png'.format(dd))
        if pngFile: plt.savefig(pngFile)
    return()
    
def plotMaps(detpairs,grid=15,plotDir='',dataDir='',plottype='imshow',
            fignum=None,units='ms',colormap='jet'):
    p=0
    for dd in detpairs:
        p=p+1
        pngFile=os.path.join(plotDir,'dt_imshow_{}.png'.format(detpairs[dd].code))
        csvFile=os.path.join(dataDir,'tt_{}.csv'.format(detpairs[dd].code))
        dtData(detpairs[dd],csvFile=csvFile)
        dtMap(detpairs[dd],pngFile=pngFile,fignum=p)
    plt.show()