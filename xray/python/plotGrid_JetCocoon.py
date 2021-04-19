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
    # 'Gaussian-0-1Gly':{'label2':r'Tapered beam','plot':0,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'Gaussian-0-100Mly':{'color':'orange','plot':0,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'Gaussian-0-10Mly':{'color':'green','plot':0,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1e7*u.lyr.to(u.cm)}},
        
    'Gaussian-0':{'plot':0,'legend':r'Tapered Jet',
        'label2':r'$\theta=0^\circ$',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(0),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-0':{'plot':0,'legend':'Sharp-edged Jet',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1.2e8*u.lyr.to(u.cm)}},
        
    'Gaussian-10':{'plot':1,'legend':r'Tapered Jet',
        'label2':r'$\theta=10^\circ$',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-10':{'plot':1,'legend':'Sharp-edged Jet',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1.2e8*u.lyr.to(u.cm)}},
    
    'Gaussian-20':{'plot':2,'legend':r'Tapered Jet',
        'label2':r'$\theta=20^\circ$',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-20':{'plot':2,'legend':'Sharp-edged Jet',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1.2e8*u.lyr.to(u.cm)}},
    
    'Gaussian-30':{'plot':3,'legend':r'Tapered Jet',
        'label2':r'$\theta=30^\circ$',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-30':{'plot':3,'legend':r'($\theta=30^\circ$)','legend':'Sharp-edged Jet',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1.2e8*u.lyr.to(u.cm)}},
        
    'Gaussian-40':{'plot':4,'legend':r'Tapered Jet',
        'label2':r'$\theta=40^\circ$',
        'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(40),'d_L':1.2e8*u.lyr.to(u.cm)}},
    'TopHat-40':{'plot':4,'legend':r'($\theta=40^\circ$)','legend':'Sharp-edged Jet',
        'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(40),'d_L':1.2e8*u.lyr.to(u.cm)}},
        
    'Spherical':{'label2':r'Spherical','plot':5,'legend':r'Spherical',
        'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
        'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
        'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
    
        
    # 'Spherical-0-1Gly_0.01-8.5':{'label2':r'Spherical','plot':4,'legend':r'Bestfit (cocoon)',
    #     'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),'d_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':0.01,'k':5.6,'Er':1e54,'MFast_solar':1e-5,'p':2.156,'epsilon_e':1e-1,'epsilon_B':1e-3}},
    # 'Spherical-0-1Gly_1e51':{'label2':r'Spherical','plot':4,'legend':r'Er1e51',
    #     'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),
    #     'd_L':1.2e8*u.lyr.to(u.cm),'uMax':8.5,'uMin':1e-4,'k':5.6,
    #     'Er':3e53,'MFast_solar':10**-6.5,'p':2.156,'epsilon_e':10**-2.7,'epsilon_B':10**-2.5}},
    # 'Jet-Bestfit':{'plot':4,'legend':r'Bestfit (jet)',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1.2e8*u.lyr.to(u.cm)}},
    # 'Spherical-0-1Gly_0.67-3.5':{'label2':r'Spherical','plot':4,'legend':r'0.67-186',
    #     'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm),'uMax':18.6,'uMin':0.67,'k':5,'Er':1e51,'MFast_solar':5e-2}},
    # 'Spherical-0-1Gly_0.67-18.6':{'plot':4,'legend':r'0.67-1.67',
    #     'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm),'uMax':18.6,'uMin':1.67,'k':5,'Er':1e51,'MFast_solar':5e-2}},
    # 'Spherical-0-1Gly_1.25-3.5':{'plot':4,'legend':r'1.25-3.5',
    #     'pars':{'jetType':grb.jet.Spherical,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm),'uMax':3.5,'uMin':1.25,'k':5,'Er':1e51,'MFast_solar':5e-2}},
    
    # 'Gaussian-10-1Gly':{'label2':r'Tapered beam $\theta=10^\circ$','plot':1,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'Gaussian-10-100Mly':{'plot':1,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'Gaussian-10-10Mly':{'plot':1,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':1e7*u.lyr.to(u.cm)}},
    # 
    # 'Gaussian-20-1Gly':{'label2':r'Tapered beam','plot':2,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'Gaussian-20-100Mly':{'plot':2,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'Gaussian-20-10Mly':{'plot':2,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e7*u.lyr.to(u.cm)}},
    # 
    # 'Gaussian-30-1Gly':{'label2':r'Tapered beam','plot':3,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'Gaussian-30-100Mly':{'plot':3,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'Gaussian-30-10Mly':{'plot':3,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':1e7*u.lyr.to(u.cm)}},
    
    # 'TopHat-0-1Gly':{'label2':r'Spherical','plot':4,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'TopHat-0-100Mly':{'plot':4,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'TopHat-0-10Mly':{'plot':4,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(0),'d_L':1e7*u.lyr.to(u.cm)}},
    
    # 'TopHat-10-1Gly':{'label2':r'Sharp-edged beam','plot':5,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'TopHat-10-100Mly':{'plot':5,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'TopHat-10-10Mly':{'plot':5,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(10),'d_L':1e7*u.lyr.to(u.cm)}},
    # 
    # 'TopHat-20-1Gly':{'label2':r'Sharp-edged beam','plot':6,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'TopHat-20-100Mly':{'plot':6,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'TopHat-20-10Mly':{'plot':6,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(20),'d_L':1e7*u.lyr.to(u.cm)}},
    # 
    # 'TopHat-30-1Gly':{'label2':r'Sharp-edged beam','plot':7,'legend':r'$D=$1bn ly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1e9*u.lyr.to(u.cm)}},
    # 'TopHat-30-100Mly':{'plot':7,'legend':r'$D=$100 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1e8*u.lyr.to(u.cm)}},
    # 'TopHat-30-10Mly':{'plot':7,'legend':r'$D=$10 Mly',
    #     'pars':{'jetType':grb.jet.TopHat,'thetaObs':np.deg2rad(30),'d_L':1e7*u.lyr.to(u.cm)}},
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
    # ax.plot(tday[:,0], models[m]['Fnu'][:,0]*1e6, ls='-', label=label)
    xray.plotModels(ax,tday,models[m],label=label,fact=1e3,
        ylabel=r'Flux ($\mu$Jy)',ylim=[1e-6,1e4],xlim=[1,3e4])
    axes[0,0].set_yticks([1e-6,1e-4,1e-2,1,1e2,1e4])
    axes[0,0].set_yticklabels(["0.000001","0.0001","0.01","1","100","10,000"])
    
    xray.plotModels(axind,tday,models[m],label=label,fact=1e3,
        ylabel=r'Flux ($\mu$Jy)',ylim=[1e-6,1e4],xlim=[1,3e4])
    axes[0,0].set_yticks([1e-6,1e-4,1e-2,1,1e2,1e4])
    axes[0,0].set_yticklabels(["0.000001","0.0001","0.01","1","100","10,000"])
    # ax[x,y].set_title(titles[p])
    # if p==0:
    #     ax[x,y].legend()
    if not insPlotted[plot]:
        axins=ax.inset_axes([0.65,0.75,0.3,0.2])
        xray.plotInset(axins,models[m],thetaObs=models[m]['pars']['thetaObs'])
        
        axinsind=axind.inset_axes([0.65,0.7,0.3,0.2])
        xray.plotInset(axinsind,models[m],thetaObs=models[m]['pars']['thetaObs'])
        insPlotted[plot]=True
    
    if not dataPlotted[plot]:
        xray.plotData(ax)
        xray.plotData(axind)
        dataPlotted[plot]=True
        
axes[0,0].legend(loc='lower left')
figgrid.tight_layout()

for p in range(len(figlist)):
    if isinstance(figlist[p],dict):
        figgrid.tight_layout()
        fname='plot_grid-{}'.format(p)
        for m in range(len(figlist[p]['models'])):
            fname=fname+figlist[p]['models'][m]
        fname=fname+'.png'
        print('saving',fname)
        figgrid.tight_layout()
        figlist[p]['fig'].savefig(os.path.join(plotDir,fname))
plt.show()

print("Saving grid_light_curves_beamshape.png")
figgrid.savefig(os.path.join(plotDir,"grid_light_curves_beamshape.png"))
# plt.close(fig)
