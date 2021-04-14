import numpy as np
import matplotlib.pyplot as plt
import afterglowpy as grb
import astropy.constants as C
import astropy.units as u
plt.ion()

# Jet Parameters
Z = {'jetType':     grb.jet.Gaussian,     # Gaussian jet
     'specType':    0,                  # Basic Synchrotron Emission Spectrum

     'thetaObs':    0.3,   # Viewing angle in radians
     'E0':          1.0e53, # Isotropic-equivalent energy in erg
     'thetaCore':   0.05,    # Half-opening angle in radians
     'thetaWing':   0.4,    # Outer truncation angle
     'n0':          1.0e-3,    # circumburst density in cm^{-3}
     'p':           2.2,    # electron energy distribution index
     'epsilon_e':   0.1,    # epsilon_e
     'epsilon_B':   0.0001,   # epsilon_B
     'xi_N':        1.0,    # Fraction of electrons accelerated
     'd_L':         1.36e26, # Luminosity distance in cm
     'z':           0.01}   # redshift

models={
    'On-axis 40Mpc':{'pars':{'jetType':grb.jet.Gaussian,'thetaObs':0,'d_L':44*u.Mpc.to(u.cm)},'ax':[1,1]},
    '5deg Off-axis 40Mpc':{'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(5),'d_L':44*u.Mpc.to(u.cm)},'ax':[1,1]},
    '10deg Off-axis 40Mpc':{'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(10),'d_L':44*u.Mpc.to(u.cm)},'ax':[1,1]},
    '20deg Off-axis 40Mpc':{'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':44*u.Mpc.to(u.cm)},'ax':[1,1]},
    '30deg Off-axis 40Mpc':{'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(30),'d_L':44*u.Mpc.to(u.cm)},'ax':[1,1]},
    # '20deg Off-axis 1Gpc':{'pars':{'jetType':grb.jet.Gaussian,'thetaObs':np.deg2rad(20),'d_L':1e3*u.Mpc.to(u.cm)},'ax':[1,1]},
    # 'Gaussian 0.2':{'jetType':grb.jet.Gaussian,'thetaObs':0.2},
    # 'Gaussian 0.5':{'jetType':grb.jet.Gaussian,'thetaObs':0.5},
    # 'Gaussian 1.0':{'jetType':grb.jet.Gaussian,'thetaObs':1},
    # 'TopHat 0':{'jetType':grb.jet.TopHat,'thetaObs':0},
    # 'TopHat 0.2':{'jetType':grb.jet.TopHat,'thetaObs':0.2},
    # 'TopHat 0.5':{'jetType':grb.jet.TopHat,'thetaObs':0.5},
    # 'TopHat 1.0':{'jetType':grb.jet.TopHat,'thetaObs':1},
}

# Time and Frequencies
Nt = 100
Nnu = 4
t = np.empty((Nt, Nnu))
nu = np.empty((Nt, Nnu))

ta = 1.00 * grb.day2sec
tb = 1.0e3 * grb.day2sec
nuR = 6.0e9
nuI = 1.0e14
nuO = 1.0e15
nuX = 1.0e18

t[:, :] = np.geomspace(ta, tb, num=Nt)[:, None]
nu[:, 0] = nuR
nu[:, 1] = nuO
nu[:, 2] = nuO
nu[:, 3] = nuX
titles=['Radio','IR','Optical','Xray']

# Calculate!
print("Calculate!")
for m in models:
    print('Calculating {}...'.format(m))
    pars={}
    for p in Z:
        pars[p]=Z[p]
    for p in models[m]['pars']:
        pars[p]=models[m]['pars'][p]
    models[m]['Fnu'] = grb.fluxDensity(t, nu, **pars)

# Plot!
print("Plot")

tday = t * grb.sec2day

fig, ax = plt.subplots(2,2,num=1,clear=True,sharex='all')
p=0
for p in range(len(nu[0,:])):
    x=int(p/2)
    y=p%2
    for m in models:
        ax[x,y].plot(tday[:,p], models[m]['Fnu'][:,p], ls='-', label=m)
    ax[x,y].set_xscale('log')
    ax[x,y].set_yscale('log')
    ax[x,y].set_xlabel(r'$t$ (d)')
    ax[x,y].set_ylabel(r'$F_\nu$ (mJy)')
    ax[x,y].set_title(titles[p])
    if p==0:
        ax[x,y].legend()
    p=p+1

fig.tight_layout()

print("Saving multi-band_light_curves.png")
fig.savefig("multi-band_light_curves.png")
# plt.close(fig)
plt.show()