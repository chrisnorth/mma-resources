import numpy as np
import json,string,os
from astropy import units as u
from astropy import constants as const
from matplotlib import pyplot as plt
from matplotlib import cm
import pandas as pd

import afterglowpy as grb

class EventXray(object):
    def __init__(self,parent):
        self.parent=parent
        self.name=parent.nameXray
        # self.inc=parent.initParams.get('inclination_deg',None)
        # self.inc=parent.initParams.get('inclination_deg',None)
        self.readParams()
        self.readData()
        return
    
    def readParams(self,fileIn='xray_catalogue.json',dirIn='data/Xray'):
        catIn=json.load(open(os.path.join(dirIn,fileIn)))
        if not 'events' in catIn:
            print('No events in {}'.format(os.path.join(dirIn,fileIn)))
            return
        else:
            if not self.name in catIn["events"]:
                print('No entry for {} in Xray catalogue'.format(self.name))
                return
            else:
                params=catIn["events"][self.name]
                self.datafile=params.get('datafile',None)
                self.inclination=params.get('inclination_deg',None)
        return(params)
        
    def readData(self):
        # read data from file
        data=pd.read_csv(self.datafile)
        self.data=data
        return data
        
    def plotData(self,ax,dataMin=0,dataMax=1e5,tMin=0,tMax=1e4,fact=1e6,setlim=False):
        import pandas as pd
        dataIn=self.data
        dataPlot=dataIn[(dataIn['Time']>=dataMin)&(dataIn['Time']<=dataMax)]
        dataPlotErr=dataIn[(dataIn['Time']>=dataMin)&(dataIn['Time']<=dataMax)&(dataIn['Note']!='upper limit')]
        dataPlotUpper=dataIn[(dataIn['Time']>=dataMin)&(dataIn['Time']<=dataMax)&(dataIn['Note']=='upper limit')]
        ax.plot(dataPlotUpper['Time'],
            dataPlotUpper['Flux Density Jy']*fact,
            'v',color='k')
        ax.errorbar(dataPlotErr['Time'],
            dataPlotErr['Flux Density Jy']*fact,
            yerr=dataPlotErr['Flux Density Error']*fact,
            marker='x',label='Data',capsize=3,ms=5,linestyle='',color='k')
        if setlim:
            miny=np.min(dataPlotErr['Flux Density Jy']-dataPlotErr['Flux Density Error'])
            maxy=np.max(dataPlotErr['Flux Density Jy']+dataPlotErr['Flux Density Error'])
            ax.set_ylim([fact*miny/2,fact*maxy*2])
        return

class XrayModel(object):
    def __init__(self,name,params,meta={}):
        self.name=name
        self.setParams(params)
        self.setMeta(meta)
        return
    
    def setParams(self,params):
        self.params=params
        if 'd_ly' in self.params:
            self.params['d_L']=self.params['d_ly']*u.lyr.to(u.cm)
            del self.params['d_ly']
        newparams=[]
        for p in params:
            if p.find('_deg')>=0:
                newparams.append({'old':p,'new':p.replace('_deg',''),'val':np.deg2rad(self.params[p])})
        for newp in newparams:
            self.params[newp['new']]=newp['val']
            del self.params[newp['old']]
        return
        
    def setMeta(self,meta):
        self.meta=meta
        return
        
    def setThetaObs(self,thetaIn,unitsIn='deg'):
        try:
            thetaconv=1./u.rad.to(unitsIn)
        except:
            print('Warning: unable to convert from {} to rad'.format(unitsIn))
            thetaconv=1
        self.params['thetaObs']=thetaIn*thetaconv
        return
        
    def setTimeArr(self,t0,t1,Nt,log=True,unitsIn='day'):
        try:
            tconv=1./u.s.to(unitsIn)
        except:
            print('Warning: unable to convert from {} to s'.format(unitsIn))
            tconv=1
        ta=t0*tconv
        tb=t1*tconv
        if log:
            tarr=np.geomspace(ta, tb, num=Nt)
        else:
            tarr=np.linspace(ta, tb, num=Nt)
        self.tarr=tarr
        self.tunit=u.s
        self.Nt=len(tarr)
        return
        
    def setNuArr(self,nuIn,unitsIn='Hz'):
        try:
            nuconv=1./u.Hz.to(unitsIn,equivalencies=u.spectral())
        except:
            print('Warning: unable to convert from {} to Hz'.format(unitsIn))
            nuconv=1
        if np.isscalar(nuIn):
            nu=np.array([nuIn])*nuconv
        else:
            nu=np.array(nuIn)*nuconv
        self.nuarr=nu
        self.Nnu=len(nu)
        return
    
    def calculate(self):
        tarr = np.empty((self.Nt, self.Nnu))
        nuarr = np.empty((self.Nt, self.Nnu))
        for n in range(self.Nnu):
            tarr[:, n] = self.tarr
            nuarr[:, n] = self.nuarr[n]
        
        pars=self.params
        print('theta={:.2f}deg, d_L={:.2f} Mpc'.format(np.rad2deg(pars['thetaObs']),pars['d_L']*u.cm.to(u.Mpc)))
        self.flux=grb.fluxDensity(tarr, nuarr, **pars)
        self.fluxunits=u.mJy
        return
    
    def getParam(self,param):
        if param in self.params:
            return(self.params[param])
        else:
            print('Warning: no param {} in model {}',format(param,self.name))
            return
    def getJetType(self):
        return(self.params['jetType'])
        
    def getFlux(self,units='uJy'):
        try:
            conv=u.mJy.to('uJy')
        except:
            print('Warning: unable to convert from uJy to {}'.format(units))
            conv=1
        return(self.flux*conv)
    def getTimeArray(self,units='day'):
        try:
            conv=self.tunit.to(units)
        except:
            print('Warning: unable to convert from s to {}'.format(units))
            conv=1
        return(self.tarr*conv)
        
    def getInclination(self,units='rad'):
        try:
            conv=u.rad.to(units)
        except:
            print('Warning: unable to convert from rad to {}'.format(units))
            conv=1
        return(self.params['thetaObs']*conv)

def loadModels(meta={},fileIn='xray_catalog.json',dirIn='data/xray'):
    """
    Read model parameters from file, and convert to XrayModel objects
    Inputs:
      * [string OR dict] filename to read parameters from (json format) OR dict of parameters
    Output: [dict] dict containing XrayModel objects
    """
    if isinstance(fileIn,str):
        # read from file
        dataIn=json.load(open(os.path.join(dirIn,fileIn)))
    else:
        # use data object
        dataIn=fileIn
    models={}
    if 'models' in dataIn:
        for m in dataIn['models']:
            models[m]=XrayModel(m,dataIn['models'][m],meta=meta.get(m,'{}'))
    return(models)

# def plotModels(ax,inc,models,ylim=None,xlim=[1,3000],
#     showlegend=True,grid=True,ylabel=r'Flux ($\mu$Jy)',alpha=0.5,nolabel=False,**kwargs):
# 
#     for m in models:
#         mod=models[m]
#         col=mod.meta.get('color',None)
#         lw=mod.meta.get('lw',10)
#         alpha=mod.meta.get('alpha',10)
#         ax.plot(mod.getTimeArray('day'),mod.getFlux(),color=col,lw=lw,alpha=alpha)
#     if showlegend:
#         legendloc=kwargs.get('legendloc','upper left')
#         if legendloc!='none':
#             ax.legend(loc=legendloc)
#     dayticks=np.array([1,3,10,30,100,300,1000,3000,10000])
#     dayticks=dayticks[np.where((dayticks>=xlim[0])&(dayticks<=xlim[1]))]
#     ax.set_xticks(dayticks)
#     ax.set_xticklabels(dayticks)
#     ax.grid(grid)
#     return
# def plotModels(ax,tday,models,ylim=None,xlim=[1,3000],fact=1,label=None,
#     showlegend=True,grid=True,ylabel=r'Flux (nJy)',alpha=0.5,nolabel=False,**kwargs):
# 
#     if isinstance(models,dict):
#         mods=[models]
#     else:
#         mods=models
# 
#     # label=kwargs.get('label',None)
#     for m in range(len(mods)):
#         color=mods[m].get('color',None)
#         # label=mods[m].get('legend',None)
#         # ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e6, ls='-', label=label)
#         # print ('label:',label)
#         ax.plot(tday[:,0], mods[m]['Fnu'][:,0]*fact, ls='-', label=label,lw=10,alpha=alpha)
#         ax.set_xscale('log')
#         ax.set_yscale('log')
#         if ylim!=None:
#             ax.set_ylim(ylim[0],ylim[1])
#         ax.set_xlabel('Time (days)')
#         ax.set_ylabel(ylabel)
#         # ax.set_ylabel(r'$F_\nu$ (mJy)')
#         ax.set_xlim(xlim[0],xlim[1])
#         dayticks=np.array([1,3,10,30,100,300,1000,3000,10000])
#         dayticks=dayticks[np.where((dayticks>=xlim[0])&(dayticks<=xlim[1]))]
#         ax.set_xticks(dayticks)
#         ax.set_xticklabels(dayticks)
#         # ax.set_xticklabels(['1 day','1 week','1 month','6 months','1 year'])
#         if 'label1' in mods[m] and not nolabel:
#             ax.annotate(mods[m]['label1'],(0.01,0.95),xycoords='axes fraction',va='top')
#         if 'label2' in mods[m] and not nolabel:
#             ax.annotate(mods[m]['label2'],(0.95,0.95),xycoords='axes fraction',va='top',ha='right',fontsize='large')
#         ax.grid(grid)
#         if showlegend:
#             legendloc=kwargs.get('legendloc','upper left')
#             if legendloc!='none':
#                 ax.legend(loc=legendloc)
# 
#     return
# 
# def plotInset(ax,model,thetaObs=0,thetaCore=0.1,thetaWing=0.4):
#     # print('inset')
#     ax.set_xlim(-3,3)
#     ax.set_ylim(-1.5,1.5)
#     ax.set_aspect('equal')
#     ax.axis('off')
# 
#     jT=model['pars']['jetType']
#     jR=2
#     if jT==0:
#         for tt in np.arange(10):
#             # th=thetaWing-tt*0.1*(thetaWing-thetaCore)
#             # col=1-tt*0.05
#             th=thetaWing-tt*0.1*(thetaWing)
#             col=1-tt*0.07
#             ax.fill([0,jR*np.cos(th),jR*np.cos(th)],
#                 [0,jR*np.sin(th),-jR*np.sin(th)],
#                 color=(col,col,col))
#             ax.fill([0,-jR*np.cos(th),-jR*np.cos(th)],
#                 [0,jR*np.sin(th),-jR*np.sin(th)],
#                 color=(col,col,col))
#         # ax.fill([0,np.cos(thetaCore),np.cos(thetaCore)],[0,np.sin(thetaCore),-np.sin(thetaCore)],color='#555555')
#     elif jT==-1:
#         ax.fill([0,jR*np.cos(thetaCore),jR*np.cos(thetaCore)],
#             [0,jR*np.sin(thetaCore),-jR*np.sin(thetaCore)],color=(col,col,col))
#         ax.fill([0,-jR*np.cos(thetaCore),-jR*np.cos(thetaCore)],
#             [0,jR*np.sin(thetaCore),-jR*np.sin(thetaCore)],color=(col,col,col))
#     elif jT==3:
#         th=np.arange(0,361,2)
#         xc=np.sin(np.deg2rad(th))
#         yc=np.cos(np.deg2rad(th))
#         for r in np.arange(1,0,-0.1):
#             col=0.3+r*0.7
#             ax.fill(r*xc,r*yc,color=(0.3,0.3,0.3),alpha=1-col)
# 
#     dx=np.cos(thetaObs)
#     dy=-np.sin(thetaObs)
#     if thetaObs>np.deg2rad(30):
#         aR=1.8
#     else:
#         aR=2.8
#     ax.arrow(aR*dx,aR*dy,-0.7*dx,-0.7*dy,width=0.1,length_includes_head=True,color='r')
#     ax.plot([0,(aR-1)*dx],[0,(aR-1)*dy],ls=':',c='r')
#     # if jT==0 or jT==-1:
#     #     ax.annotate(r'$\theta={:.0f}^\circ$'.format(np.rad2deg(thetaObs)),[2*dx,2*dy],va='center')
# 
#     return
# 
# def plotData(ax,dataMin=0,dataMax=1e5,tMin=0,tMax=1e4,fact=1e6,setlim=False,dataDir='data/xray'):
#     import pandas as pd
#     dataIn=pd.read_csv(os.path.join(dataDir,'GW170817_xray.csv'))
#     # print(dataIn['Time'],dataIn['Flux Density Jy'])
#     dataPlot=dataIn[(dataIn['Time']>=dataMin)&(dataIn['Time']<=dataMax)]
#     dataPlotErr=dataIn[(dataIn['Time']>=dataMin)&(dataIn['Time']<=dataMax)&(dataIn['Note']!='upper limit')]
#     dataPlotUpper=dataIn[(dataIn['Time']>=dataMin)&(dataIn['Time']<=dataMax)&(dataIn['Note']=='upper limit')]
#     # ax.plot(dataPlot['Time'],
#     #     dataPlot['Flux Density Jy']*fact,
#     #     'x',label='Data')
#     ax.plot(dataPlotUpper['Time'],
#         dataPlotUpper['Flux Density Jy']*fact,
#         'v',color='k')
#     ax.errorbar(dataPlotErr['Time'],
#         dataPlotErr['Flux Density Jy']*fact,
#         yerr=dataPlotErr['Flux Density Error']*fact,
#         marker='x',label='Data',capsize=3,ms=5,linestyle='',color='k')
#     if setlim:
#         miny=np.min(dataPlotErr['Flux Density Jy']-dataPlotErr['Flux Density Error'])
#         maxy=np.max(dataPlotErr['Flux Density Jy']+dataPlotErr['Flux Density Error'])
#         ax.set_ylim([fact*miny/2,fact*maxy*2])
#         # minx=np.min(dataPlot['Time'])/10
#         # maxx=np.max(dataPlot['Time'])*10
#         # ax.set_xlim(minx,maxx)
#         # dayticks=np.array([1,3,10,30,100,300,1000,3000,10000])
#         # dayticks=dayticks[np.where((dayticks>=minx)&(dayticks<=maxx))]
#         # ax.set_xticks(dayticks)
#         # ax.set_xticklabels(dayticks)
#     return
    