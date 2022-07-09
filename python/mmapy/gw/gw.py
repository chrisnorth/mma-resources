import numpy as np
from scipy.interpolate import interp1d
import json,string,os
from astropy import units as u
from astropy import constants as const
from matplotlib import pyplot as plt
from matplotlib import cm
import pandas as pd
from gwpy.timeseries import TimeSeries
from gwpy.frequencyseries import FrequencySeries
import datetime
from pycbc.waveform import get_td_waveform
from .. import utils as ut


# def ut.d2r(d):
#     # convert degree to radians
#     return(d/180.*np.pi)
#
# def lonlat2vec(loc):
#     """
#     Convert lon,lat to unit vector
#     Input: [list] 2-element list containing [longitude,latitude] (in degrees)
#     Output: [lest] unit vector
#     """
#     vec=np.array([np.cos(ut.d2r(loc[0]))*np.cos(ut.d2r(loc[1])),
#         np.sin(ut.d2r(loc[0]))*np.cos(ut.d2r(loc[1])),
#         np.sin(ut.d2r(loc[1]))])
#     return vec

class Detectors(object):
    def __init__(self,detsIn):
        self.dets={}
        try:
            for d in detsIn:
                if isinstance(detsIn,list):
                    det=d
                elif isinstance(detsIn,dict):
                    det=detsIn[d]
                if isinstance(det,Detector):
                    self.dets[det.code]=det
                else:
                    try:
                        detector=Detector(det,**kwargs)
                        self.dets[detector.code]=detector
                    except:
                        print('unable to add detector',detector)
        except:
            pass
        return

    def addDetector(self,detIn,**kwargs):
        if isinstance(detIn,Event):
            self.dets[detIn.code]=detIn
        else:
            try:
                det=Detector(detIn,**kwargs)
                self.dets[dets.code]=det
            except:
                print('unable to add detector',det)
        return
    def to_json(self):
        js={}
        for d in self.dets:
            js[d]=self.dets[d].to_json()
        return(js)

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
        vec=np.array([np.cos(ut.d2r(self.lon))*np.cos(ut.d2r(self.lat)),
            np.sin(ut.d2r(self.lon))*np.cos(ut.d2r(self.lat)),
            np.sin(ut.d2r(self.lat))])
        return vec
    def to_json(self):
        js={'name':self.name,'code':self.code,'location':self.loc}
        return(js)

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
                    vec=ut.lonlat2vec([gridRAim[r],gridDecim[d]])
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
                vec=ut.lonlat2vec([gridRA[r],gridDec[d]])
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
    def __init__(self,parent,**kwargs):
        self.parent=parent
        self.name=parent.name
        self.nameCat=parent.nameGW
        # self.loc=parent.loc
        # self.setLoc(parent.loc)
        self.loc=parent.loc
        self.datetime=parent.datetime
        fromCat=kwargs.get('fromCat',False)
        if 'fromCat':
            self.readCatParams()
        else:
            self.readParams()
        self.files={}
        return

    def readCatParams(self,fileIn='gwcat.json',dirIn='data/GW'):
        catIn=json.load(open(os.path.join(dirIn,fileIn)))
        print('Reading from gwcat catalogue')
        if not 'events' in catIn:
            print('No event events in {}'.format(os.path.join(dirIn,fileIn)))
            return
        else:
            if not self.nameCat in catIn["events"]:
                print('No entry for {} in GW catalogue'.format(self.nameCat))
                return
            else:
                print('Reading {}'.format(self.nameCat))
                self.paramsrc='gwcat'
                params=catIn["events"][self.nameCat]
                m1param=params.get('M1',None)
                if m1param:
                    self.m1=m1param.get('best',None)
                m2param=params.get('M2',None)
                if m2param:
                    self.m2=m2param.get('best',None)
                mtotparam=params.get('Mtotal',None)
                if mtotparam:
                    self.mtot=mtotparam.get('best',None)
                else:
                    self.mtot=self.m1+self.m2
                mchirpparam=params.get('Mchirp',None)
                if mchirpparam:
                    self.mch=mchirpparam.get('best',None)
                mratioparams=params.get('Mratio',None)
                if mratioparams:
                    self.q=mratioparams.get('best',None)
                else:
                    self.q=self.m2/self.m1
                distparam=params.get('DL',None)
                if distparam:
                    self.dist=distparam.get('best',None)

                if 'gw_dets' in self.parent.initParams:
                    self.detlist=self.parent.initParams.get('gw_dets',[])

                else:
                    detparams=params.get('net',None)
                    if detparams:
                        detlist=detparams.get('best','')
                        self.detlist=[]
                        for d in range(len(detlist)):
                            self.detlist.append(detlist[d])
                print('detlist',self.detlist)
                detectors=readDetectors(fileIn,dirIn)
                self.setGwDets(detectors)
        return(params)

    def readParams(self,fileIn='gw_catalogue.json',dirIn='data/GW'):
        catIn=json.load(open(os.path.join(dirIn,fileIn)))
        if not 'events' in catIn:
            print('No events in {}'.format(os.path.join(dirIn,fileIn)))
            return
        else:
            if not self.nameCat in catIn["events"]:
                print('No entry for {} in GW catalogue'.format(self.nameCat))
                return
            else:
                self.paramsrc='initparams'
                params=catIn["events"][self.nameCat]
                self.mtot=params.get('totalmass_Msun',None)
                self.q=params.get('massratio',None)
                self.dist=params.get('dist_Mpc',None)
                self.m1=mtot_to_m1(self.mtot,self.q)
                self.m2=mtot_to_m2(self.mtot,self.q)
                self.mch=m1m2_to_mch(self.m1,self.m2)
                self.detlist=params.get('gw_dets',[])
                detectors=readDetectors(fileIn,dirIn)
                self.setGwDets(detectors)
        return(params)

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
        gridvec=ut.lonlat2vec(self.loc.cellloc)
        self.detectors={}
        self.dtvals={}
        for d in self.detlist:
            if d in detsIn:
                if not hasattr(self,'refdet'):
                    self.refdet=d
                self.detectors[d]=detsIn[d]
                print('adding detector {}'.format(d))
        self.detpairs=dets2pairs(self.detectors)
        self.dt={}
        # raStr=string.ascii_uppercase[:24]
        # decStr=[str(x) for x in np.arange(12) + 1]
        # decStr.reverse()
        # self.cell=raStr[int(self.cellloc[0]/15)]+decStr[int((90-self.cellloc[1])/15)]
        print('\n\n\n',self.name,self.loc.loc,self.loc.cellloc,self.loc.cellxy,self.loc.cellname)
        dplist=[]
        for dd in self.detpairs:
            dtobj={}
            detp=self.detpairs[dd]
            dtobj['arr']=detp.dtData()
            dtobj['value']=detp.vec2dt(gridvec).to(dtobj['arr']['units']).value

            dtobj['matchmap'],dtobj['cells']=detp.getGridLocs(gridvec)
            self.dt[dd]=dtobj
            d1=detp.d1.code
            d2=detp.d2.code
            if self.refdet==d1:
                self.dtvals[d1]=0
                print('setting reference dt=0 for {}'.format(d1))
            elif self.refdet==d2:
                self.dtvals[d2]=0
                print('setting reference dt=0 for {}'.format(d2))
            if d1 in self.dtvals:
                self.dtvals[d2]=self.dtvals[d1] - dtobj['value']*1e-3
            elif d2 in self.dtvals:
                self.dtvals[d1]=dtobj['value']*1e-3 - self.dtvals[d2]
            else:
                print('WARNING: neither {} or {} in dtvals [{}]'.format(d1,d2,self.dtvals))
            print(dd,dtobj['value'])
            print(dtobj['cells'])

        cellmatches=[]
        npair=len(self.dt)
        matcharr=np.zeros_like(dtobj['arr']['arr'])
        for dd in self.detpairs:
            matcharr=matcharr+self.dt[dd]['matchmap']
        raStr=string.ascii_uppercase[:24]
        decStr=[str(x) for x in np.arange(12) + 1]
        decStr.reverse()
        for r in range(len(raStr)):
            for d in range(len(decStr)):
                if matcharr[d,r]==npair:
                    cellmatches.append(raStr[r]+decStr[d])
        self.matcharr=matcharr

        self.cellmatches=cellmatches
        print('cell matches:',self.cellmatches)
        return

    def to_json(self):
        js={'m1':self.m1,'m2':self.m2,'distance':self.dist,'chirpmass':self.mch,
            'totalmass':self.mtot,'massratio':ut.truncate(self.q),'detectors':self.detlist,
            'files':self.files,'origname':self.nameCat}
        if hasattr(self,'t0_ms'):
            js['t0_ms']=self.t0_ms
        if hasattr(self,'simParams'):
            js['simParams']=self.simParams
        js['timedelta_ms']={}
        js['dtmerger_s']={}
        js['dt_arr']={}
        for dd in self.dt:
            js['timedelta_ms'][dd]=ut.truncate(self.dt[dd]['value'])
            js['dt_arr'][dd]=self.dt[dd]['arr']['arr'].tolist()
        for d in self.dtvals:
            js['dtmerger_s'][d]=ut.truncate(self.dtvals[d],6)
        return(js)

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

        npairs=len(self.dt)
        print(npairs,'pairs')
        if npairs<4:
            nrow=2
            ncol=2
        else:
            nrow=2
            ncol=2
        fig,axes=plt.subplots(nrows=nrow,ncols=ncol,sharex=True,sharey=True)
        p=0
        for pair in self.dt:
            row=p%nrow
            col=int(p/nrow)
            print(pair,row,col)
            axpair=axes[row,col]
            axpair.imshow(self.dt[pair]['matchmap'])
            axpair.title.set_text('{}: {}'.format(self.name,pair))
            axpair.grid(axis='both',which='major',alpha=1)
            p=p+1
        row=p%nrow
        col=int(p/nrow)
        ax=axes[row,col]
        print('all',row,col)
        matchim=ax.imshow(matcharr)
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
        plt.title('Matching cells: {}'.format(self.name))

        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        cax=plt.axes([0.25,0.1,0.5,0.02])
        # plt.colorbar(matcharr,cax=cax,location='bottom',label='N matches')
        plt.colorbar(matchim,cax=cax,orientation='horizontal',label='N matches')

        pngfile=os.path.join(plotDir,'{}_matchcells.png'.format(self.name))
        plt.savefig(pngfile)
        self.files['matchcells_png']=pngfile
        return

    def makewaveform(self,dataDir='',csvfile=None,hfact=1e21,precision=4,noise=1e-22,dur=1):
        self.waveform=Waveform(mtot=self.mtot,q=self.q,dist=self.dist,noise=noise)
        if not csvfile:
            csvfile='{}_waveform.csv'.format(self.name)
        indur=np.where(self.waveform.data['t']>-dur)[0]
        ms=datetime.datetime.fromisoformat(self.datetime).microsecond/1000
        self.waveform.data['t']=self.waveform.data['t']+ms/1000

        # save to file
        wf_print=pd.DataFrame({'t':self.waveform.data['t'][indur],'strain*{}'.format(hfact):self.waveform.data['strain'][indur]*hfact})
        print(wf_print[0:10])
        wf_print.to_csv(os.path.join(dataDir,csvfile),float_format='%.{}f'.format(precision),index=False)
        self.files['waveform_csv']=csvfile
        self.t0_ms=ms
        return

    def makeSims(self,dataDir='',csvfile=None,hfact=1e21,precision=4,noise=0,dur=1,overwrite=False):
        simParams={}
        simsM=[5,10,30,50]
        simsD=[50,100,300,500,1000,3000,5000]
        simParams['mtot']=simsM[np.argmin(np.abs(np.array(simsM)-self.mtot))]
        simParams['dist']=simsD[np.argmin(np.abs(np.array(simsD)-self.dist))]

        qrange=np.arange(0.1,1.1,0.1)
        simFiles={}
        for q in qrange:
            csvfile='wf_Mtot{:.0f}_D{:.0f}_q{:.1f}.csv'.format(simParams['mtot'],simParams['dist'],q)
            fileout=os.path.join(dataDir,csvfile)
            simFiles['{:.1f}'.format(q)]=csvfile
            updateFile=False
            fileex=os.path.isfile(fileout)
            if fileex:
                if overwrite:
                    print('overwriting:',fileout)
                    updateFile=True
                else:
                    print('file exists:',fileout)
            else:
                updateFile=True
            if updateFile:
                waveform=Waveform(mtot=simParams['mtot'],q=self.q,dist=simParams['dist'])

                indur=np.where(self.waveform.data['t']>-dur)[0]
                wf_print=pd.DataFrame({'t':self.waveform.data['t'][indur],'strain*{}'.format(hfact):self.waveform.data['strain'][indur]*hfact})
                print(wf_print[0:10])
                wf_print.to_csv(fileout,float_format='%.{}f'.format(precision),index=False)
        self.files['simulations_csv']=simFiles['1.0']
        self.simParams=simParams
        return

def readDetectors(fileIn='gw_catalogue.json',dirIn='data/GW'):
    """
    Read detector parameters from file, and convert to Detector objects
    Inputs:
      * [string OR dict] filename to read parameters from (json format) OR dict of parameters
    Output: [dict] dict containing Detector objects
    """
    if isinstance(fileIn,str):
        # read from file
        dataIn=json.load(open(os.path.join(dirIn,fileIn)))
    else:
        # use data object
        dataIn=fileIn
    dets={}
    if 'detectors' in dataIn:
        for d in dataIn['detectors']:
            dets[d]=Detector(dataIn['detectors'][d])
    return(dets)

def mtot_to_m1(mtot,q=1):
    return mtot/(1+q)
def mtot_to_m2(mtot,q=1):
    return mtot*q/(1+q)
def m1m2_to_mch(m1,m2):
    return (m1*m2)**0.6 / (m1+m2)**0.2

class Waveform(object):
    def __init__(self,mtot=30,q=1,dist=400,fmin=None,noise=0):
        self.mtot=mtot
        self.q=q
        self.dist=dist
        self.noise=noise
        self.m1=mtot_to_m1(self.mtot,self.q)
        self.m2=mtot_to_m2(self.mtot,self.q)
        self.mch=mtot_to_m2(self.m1,self.m2)
        self.generate()
        return

    def get_fmin(self):
        fmin=50*30/self.mtot
        if fmin<20:
            fmin=20
        elif fmin>200:
            fmin=200
        if self.m1+self.m2 > 67:
            fmin=np.min([fmin,20])
        self.fmin=int(fmin)
        return(self.fmin)

    def f_to_t(self,f):
        K0=K0=2.7e17 #Msun^5 s^-5
        fitparam=[0.0029658 , 0.96112625] #empirical fit
        t=K0**(1./3.) * self.mch**(-5./3.) * f**(-8./3.)
        t=t*(self.mch*fitparam[0] + fitparam[1])
        return(t)

    def generate(self):
        # self.get_flower()
        self.tres=1./8192
        self.get_fmin()
        tmin=self.f_to_t(self.fmin)
        fref=self.fmin
        tref=self.f_to_t(fref)
        print('processing {} + {} [{}] ({} MPc) at 1/{}s resolution from {:.2f}Hz [{:.2f}s from {:.2f}Hz]'.format(self.m1,self.m2,self.mch,self.dist,1./self.tres,self.fmin,tref,fref))
        hp,hc = get_td_waveform(approximant="SEOBNRv3_opt_rk4",
                     mass1=self.m1,
                     mass2=self.m2,
                     delta_t=self.tres,
                     f_lower=self.fmin,
                     distance=self.dist)
        t= hp.sample_times
        if self.noise>0:
            noise=np.random.normal(0,self.noise,len(t.data))
            hp.data=hp.data+noise
        ts=TimeSeries(hp,dt=self.tres)
        self.timeseries=ts
        self.data=pd.DataFrame({'t':t.data,'strain':hp.data})
        return

    def addNoise(self,noise):
        if noise>0:
            if self.noise>0:
                print('WARNING: noise already present')
            self.noise=noise
            datalen=len(self.data['t'])
            noisedata=np.random.normal(0,self.noise,datalen)
            self.data['strain']=self.data['strain']+noisedata
        return

    def addNoiseReal(self,noise):

        noiseTime=TimeSeries.read('data/GW/waveforms/H-H1_GWOSC_4KHZ_R1-1126259447-32.hdf5',format='hdf5.losc')
        # noiseTime.write('data/GW/waveforms/H-H1_GWOSC_4KHZ_R1-1126259447-32.csv',format='csv')
        # noiseAsd=noiseTime.asd(fftlength=8)
        # noiseAsd.write('data/GW/waveforms/H-H1_GWOSC_4KHZ_R1-1126259447-32_ASD.csv',format='csv')

        from gwpy.signal import filter_design
        noiseFilt = noiseTime.bandpass(40, 250, filtfilt=True)
        notches = [filter_design.notch(f, noiseTime.sample_rate) for f in (60, 120, 180)]
        powernotch = filter_design.concatenate_zpks(*notches)
        hclean = noiseFilt.filter(powernotch, filtfilt=True)

        #shift times to centre on zero

        noiseStdIn=np.std(hclean)
        print('Noise std in:',noiseStdIn)
        hclean = hclean * noise / noiseStdIn
        noiseStdScaled=np.std(hclean)
        print('Noise std scaled:',noiseStdScaled)
        h_dt=hclean.dt
        # hclean.times = hclean.times - hclean.times[len(hclean) - int(1/h_dt)]
        # hcleanasd=hclean.asd(fftlength=8)

        hcleanout=hclean.crop(np.min(hclean.times)+0.5*u.s,np.max(hclean.times)-0.5*u.s)
        hcleanout.times=hcleanout.times-hcleanout.t0
        hcleanasd=hcleanout.asd(fftlength=8)
        noiseInterp=interp1d(hcleanout.times,hcleanout.data)
        noiseOut=noiseInterp(self.timeseries.times)
        self.timeseries=self.timeseries+noiseOut
        self.data['strain']=self.data['strain']+noiseOut
        # hclean.write('data/GW/waveforms/noise-only-timeseries1.csv')
        # hcleanout.write('data/GW/waveforms/noise-only-timeseries.csv')
        # hcleanasd.write('data/GW/waveforms/noise-only-asd.csv')

        self.asd=self.timeseries.asd()
        # print('signal ({}*{}={}): {} datapoints'.format(len(self.timeseries.data),self.timeseries.dt,len(self.timeseries.data)*self.timeseries.dt,len(self.asd)))
        # print('noise ({}*{}={}): {} datapoints'.format(len(hclean.data),hclean.dt,len(hclean.data)*hclean.dt,len(hcleanasd)))
        self.noise={'timeseries':hcleanout,'asd':hcleanasd}
        return


def readGWDetectors(fileIn):
    if isinstance(fileIn,str):
        dataIn=json.load(open(fileIn))
    else:
        dataIn=fileIn
    if 'GWdetectors' in dataIn:
        detsIn=dataIn['GWdetectors']
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

    dets=readGWDetectors(fileIn)
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
