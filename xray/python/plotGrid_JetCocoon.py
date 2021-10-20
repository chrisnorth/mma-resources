import sys,os,importlib
sys.path.insert(0,os.path.join('../'))
import xray
importlib.reload(xray)

import numpy as np
import matplotlib.pyplot as plt
import afterglowpy as grb
import astropy.constants as C
import astropy.units as u
plt.ion()

plotDir='plots'
dataMin=0
dataMax=1000
tMin=1
tMax=3000
dataLim=False
gridName='Jet_Gaussian-TopHat_0-40deg_Cocoon'

# Jet Parameters
Z = {'jetType':     grb.jet.Gaussian,     # Tapered beam jet
     'specType':    0,                  # Basic Synchrotron Emission Spectrum
     # 'thetaObs':    0.3,   # Viewing angle in radians
     'E0':          1.0e53, # Isotropic-equivalent energy in erg
     'thetaCore':   0.05,    # Half-opening angle in radians
     'thetaWing':   0.4,    # Outer truncation angle
     'n0':          1.0e-3,    # circumburst density in cm^{-3}
     'p':           2.2,    # electron energy distribution index
     'epsilon_e':   0.1,    # epsilon_e
     'epsilon_B':   0.0001,   # epsilon_B
     'xi_N':        1.0,    # Fraction of electrons accelerated
     'd_L':         44*u.Mpc.to(u.cm), # Luminosity distance in cm
     'z':           0.01}   # redshift


models={
    'Gaussian-0':{'plot':0,'legend':r'Tapered Jet','legendloc':'none',
        'label2':r'$\theta=0^\circ$','color':'#0000ff',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-0':{'plot':0,'legend':'Sharp-edged Jet','legendloc':'none','color':'#ffff00',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Wide-0':{'plot':0,'legend':r'($\theta=0^\circ$)','legend':'Broad Jet','legendloc':'none','color':'#009600',
        'pars':{'jetType':grb.jet.Gaussian,'thetaCore':np.deg2rad(20),'E0':1e52,'thetaObs':np.deg2rad(0),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Spherical-0':{'plot':0,'legend':r'Spherical','color':'#ff0000','legendloc':'none',
        'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
        'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
        'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
        
    'Gaussian-10':{'plot':1,'legend':r'Tapered Jet','legendloc':'none',
        'label2':r'$\theta=10^\circ$','color':'#0000ff',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-10':{'plot':1,'legend':'Sharp-edged Jet','color':'#ffff00','legendloc':'none',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Wide-10':{'plot':1,'legend':r'($\theta=10^\circ$)','legend':'Broad Jet',
        'color':'#009600','legendloc':'none',
        'pars':{'jetType':grb.jet.Gaussian,'thetaCore':np.deg2rad(20),'E0':1e52,'thetaObs':np.deg2rad(10),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Spherical-10':{'plot':1,'legend':r'Spherical',
        'color':'#ff0000','legendloc':'none',
        'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
        'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
        'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
    
    'Gaussian-20':{'plot':2,'legend':r'Tapered Jet',
        'label2':r'$\theta=20^\circ$','color':'#0000ff','legendloc':'none',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-20':{'plot':2,'legend':'Sharp-edged Jet','color':'#ffff00','legendloc':'none',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Wide-20':{'plot':2,'legend':r'($\theta=20^\circ$)','legend':'Broad Jet',
        'color':'#009600','legendloc':'none',
        'pars':{'jetType':grb.jet.Gaussian,'thetaCore':np.deg2rad(20),'E0':1e52,'thetaObs':np.deg2rad(20),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Spherical-20':{'plot':2,'legend':r'Spherical','color':'#ff0000','legendloc':'none',
        'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
        'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
        'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
    
    'Gaussian-30':{'plot':3,'legend':r'Tapered Jet',
        'label2':r'$\theta=30^\circ$','color':'#0000ff','legendloc':'none',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-30':{'plot':3,'legend':r'($\theta=30^\circ$)','legend':'Sharp-edged Jet',
        'color':'#ff0000','legendloc':'none',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Wide-30':{'plot':3,'legend':r'($\theta=30^\circ$)','legend':'Broad Jet',
        'color':'#009600','legendloc':'none',
        'pars':{'jetType':grb.jet.Gaussian,'thetaCore':np.deg2rad(20),'E0':1e52,'thetaObs':np.deg2rad(30),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Spherical-30':{'plot':3,'legend':r'Spherical','color':'#ff0000','legendloc':'none',
        'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
        'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
        'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
        
    'Gaussian-40':{'plot':4,'legend':r'Tapered Jet',
        'label2':r'$\theta=40^\circ$','color':'#0000ff','legendloc':'none',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(40),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-40':{'plot':4,'legend':r'($\theta=40^\circ$)','legend':'Sharp-edged Jet',
        'color':'#ffff00','legendloc':'none',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(40),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Wide-40':{'plot':4,'legend':r'($\theta=40^\circ$)','legend':'Broad Jet',
        'color':'#009600','legendloc':'none',
        'pars':{'jetType':grb.jet.Gaussian,'thetaCore':np.deg2rad(20),'E0':1e52,'thetaObs':np.deg2rad(40),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Spherical-40':{'plot':4,'legend':r'Spherical','color':'#ff0000','legendloc':'none',
        'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
        'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
        'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
    
    'Gaussian-legend':{'plot':5,'legend':r'Tapered Jet',
        'label2':r'$\theta=50^\circ$','color':'#0000ff','hide':True,
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(50),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-legend':{'plot':5,'legend':r'($\theta=40^\circ$)','legend':'Sharp-edged Jet','color':'#ffff00','hide':True,
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(50),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Wide-legend':{'plot':5,'legend':r'($\theta=40^\circ$)','legend':'Broad Jet',
        'color':'#009600','hide':True,
        'pars':{'jetType':grb.jet.Gaussian,'thetaCore':np.deg2rad(20),'E0':1e52,'thetaObs':np.deg2rad(50),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'Spherical-legend':{'plot':5,'legend':r'Spherical',
        'color':'#ff0000','hide':True,
        'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(50),
        'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
        'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
    # 'Spherical':{'label2':r'Spherical','plot':5,'legend':r'Spherical','color':'#ff00ff',
    #     'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
    #     'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
    #     'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
}

# Time and Frequencies
Nt = 100
Nnu = 1
t = np.empty((Nt, Nnu))
nu = np.empty((Nt, Nnu))

ta = 1.00 * grb.day2sec
tb = 3.0e4 * grb.day2sec
nuR = 6.0e9
nuI = 1.0e14
nuO = 1.0e15
nuX = 1.0e18

t[:, :] = np.geomspace(ta, tb, num=Nt)[:, None]
# nu[:, 0] = nuR
# nu[:, 1] = nuO
# nu[:, 2] = nuO
# nu[:, 3] = nuX
nu[:, 0] = nuX
titles=['Radio','IR','Optical','Xray']

# Calculate!
print("Calculate!")
for m in models:
    print('Calculating {}...'.format(m))
    pars={}
    for p in Z:
        pars[p]=Z[p]
    for p in models[m]['pars']:
        if models[m]['pars'][p]=='thetarandom':
            models[m]['pars'][p]=np.deg2rad(np.random.random()*30)
        elif models[m]['pars'][p]=='drandom':
            models[m]['pars'][p]=np.random.random()*800*u.Mpc.to(u.cm)
        pars[p]=models[m]['pars'][p]
    print('theta={:.2f}, d_L={:.2f} Mpc'.format(np.rad2deg(pars['thetaObs']),pars['d_L']*u.cm.to(u.Mpc)))
    models[m]['Fnu'] = grb.fluxDensity(t, nu, **pars)
    if 'fact' in models[m]:
        models[m]['Fnu'] = models[m]['Fnu'] * models[m]['fact']
    # models[m]['Fnu']
    # noise=np.random.normal(size=len(t[:,0]))*1e-9
    # models[m]['Fnu'][:,0] = models[m]['Fnu'][:,0]+np.abs(noise)

# Plot!
print("Plot")

tday = t * grb.sec2day

figgrid, axes = plt.subplots(2,3,num=20,figsize=(15,10),clear=True,sharex='all',sharey='all')
# figgrid, axes = plt.subplots(2,3,num=20,figsize=(15,10),clear=True)
insPlotted=np.zeros(20)
dataPlotted=np.zeros(20)

figlist=[None]*20

for m in models:
    plot=models[m]['plot']
    
    # set individual figure
    fnum=plot+1
    if not isinstance(figlist[fnum],dict):
        figind=plt.figure(fnum)
        figind.clf()
        figlist[fnum]={'fig':figind,'models':[]}
    figlist[fnum]['models'].append(m)
    axind=figind.gca()
    
    # set position in grid
    x=int(plot/3)
    y=plot%3
    print(plot,x,y)
    ax=axes[x,y]
    color=models[m].get('color',None)
    label=models[m].get('legend',m)

    legendloc=models[m].get('legendloc','upper left')
    # ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e6, ls='-', label=label)
    xray.plotModels(ax,tday,models[m],label=label,fact=1e3,
        ylabel=r'Flux ($\mu$Jy)',xlim=[tMin,tMax],legendloc=legendloc)
    xray.plotModels(axind,tday,models[m],label=label,fact=1e3,
        ylabel=r'Flux ($\mu$Jy)',xlim=[tMin,tMax],legendloc=legendloc)
    
    
    if not insPlotted[plot]:
        axins=ax.inset_axes([0.65,0.75,0.3,0.2])
        xray.plotInset(axins,models[m],thetaObs=models[m]['pars']['thetaObs'])
        
        axinsind=axind.inset_axes([0.65,0.7,0.3,0.2])
        xray.plotInset(axinsind,models[m],thetaObs=models[m]['pars']['thetaObs'])
        insPlotted[plot]=True
    
    if dataMax>0 and not dataPlotted[plot]:
        xray.plotData(ax,dataMin=dataMin,dataMax=dataMax,setlim=dataLim)
        xray.plotData(axind,dataMin=dataMin,dataMax=dataMax,setlim=dataLim)
        dataPlotted[plot]=True

    ylim=[1e-6,1e4]
    ylimdef=axes[0,0].get_ylim()
    ylim=[np.max([ylim[0],ylimdef[0]]),np.min([ylim[1],ylimdef[1]])]
    axes[0,0].set_ylim(ylim)
    axind.set_ylim(ylim)
    if ylim[1]/ylim[0]>1e8:
        yticks=np.array([1e-6,1e-4,1e-2,1,1e2,1e4])
        yticklabels=np.array(["0.000001","0.0001","0.01","1","100","10,000"])
    else:
        yticks=np.array([1e-6,1e-5,1e-4,1e-3,1e-2,1e-1,1,1e1,1e2,1e3,1e4])
        yticklabels=np.array(["0.000001","0.00001","0.0001","0.001","0.01","0.1","1","10","100","1,000","10,000"])
    axes[0,0].set_yticks(yticks[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])
    axes[0,0].set_yticklabels(yticklabels[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])
    axind.set_yticks(yticks[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])
    axind.set_yticklabels(yticklabels[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])

    # axes[0,0].set_xlim([tMin,tMax])
    # axind.set_xlim([tMin,tMax])

if dataMax>0:
    figdata=plt.figure(21,figsize=(5.5,5))
    figdata.clf()
    axdata=figdata.gca()
    xray.plotModels(axdata,tday,models[m],label='',fact=1e3,
        ylabel=r'Flux ($\mu$Jy)',xlim=[tMin,tMax],
        showlegend=False,alpha=0,nolabel=True)
    xray.plotData(axdata,dataMin=dataMin,dataMax=dataMax,setlim=dataLim)
    axdata.set_ylim(ylim)
    if ylim[1]/ylim[0]>1e8:
        yticks=np.array([1e-6,1e-4,1e-2,1,1e2,1e4])
        yticklabels=np.array(["0.000001","0.0001","0.01","1","100","10,000"])
    else:
        yticks=np.array([1e-6,1e-5,1e-4,1e-3,1e-2,1e-1,1,1e1,1e2,1e3,1e4])
        yticklabels=np.array(["0.000001","0.00001","0.0001","0.001","0.01","0.1","1","10","100","1,000","10,000"])
    axdata.set_yticks(yticks[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])
    axdata.set_yticklabels(yticklabels[np.where((yticks>=ylim[0])&(yticks<=ylim[1]))])
    fnamedata='plot_data_t{:d}-{:d}d'.format(tMin,tMax)
    fnamedata=fnamedata+'_{:d}-{:d}d'.format(dataMin,dataMax)
    if dataLim:
        fnamedata=fnamedata+'_datalim'
    print('saving',fnamedata)
    figdata.tight_layout()
    figdata.savefig(os.path.join(plotDir,fnamedata),transparent=True)
    
# axes[0,0].legend(loc='upper left')
figgrid.tight_layout()
fnameGrid='plot_grid_t{:d}-{:d}d'.format(tMin,tMax)
for p in range(len(figlist)):
    if isinstance(figlist[p],dict):
        figlist[p]['fig'].tight_layout()
        fname='plot_grid-{}_t{:d}-{:d}d'.format(p,tMin,tMax)
        for m in range(len(figlist[p]['models'])):
            fname=fname+'_'+figlist[p]['models'][m]
            fnameGrid=fnameGrid+'_'+figlist[p]['models'][m]
        if dataMax>0:
            fname=fname+'_data{:d}-{:d}d'.format(dataMin,dataMax)
            if dataLim:
                fname=fname+'_datalim'
        else:
            fname=fname+'_nodata'
        fname=fname+'.png'
        figlist[p]['fname']=fname
        print('saving',fname)
        figlist[p]['fig'].savefig(os.path.join(plotDir,figlist[p]['fname']))

# fnameGrid=gridName
if dataMax>0:
    fnameGrid=gridName+'_t{:d}-{:d}d_data{:d}-{:d}d'.format(tMin,tMax,dataMin,dataMax)
    if dataLim:
        fnameGrid=fnameGrid+'_datalim'
else:
    fnameGrid=gridName+'_t{:d}-{:d}d_nodata'.format(tMin,tMax)
fnameGrid=fnameGrid+'.png'
print("Saving all to {}".format(fnameGrid))
figgrid.savefig(os.path.join(plotDir,fnameGrid))


plt.show()

# fnameGrid="grid_light_curves_beamshape.png"
# plt.close(fig)
