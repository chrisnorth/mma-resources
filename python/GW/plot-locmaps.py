import numpy as np
import string, os
from astropy import units as u
from astropy import constants as const
from astropy.coordinates import SkyCoord
from matplotlib import pyplot as plt
from matplotlib import cm
import pandas as pd
plt.ion()

if os.getcwd().split('/')[-1]=='python':
    plotDir='../plots/GW'
    dataDir='../data/GW'
elif os.getcwd().split('/')[-1]=='GW':
    plotDir='../../plots/GW'
    dataDir='../../data/GW'
else:
    plotDir='./plots/GW'
    dataDir='./data/GW'

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

# set plot type (contour or imshow)
allowedtypes=['contour','imshow']
# plottype='contour'
plottype='imshow'
assert plottype in allowedtypes,'ERROR: INVALID PLOTTYPE [{}]'.format(plottype)

# define detectors
dets={'H':{'name':'Hanford','loc':[241,46]},
    'L':{'name':'Livingston','loc':[269,30]},
    'V':{'name':'Virgo','loc':[10,43]},
    'K':{'name':'KAGRA','loc':[137,36]}}

detvecs={}
detlist=[]
for d in dets:
    detlist.append(d)
    detvecs[d]=lb2vec(dets[d]['loc'][0],dets[d]['loc'][1])
    
# define grid size (RA,Dec) in degrees
gridsize=[15,15]

# set grid for contour plot - on gridlines, including final line
nRA=int(360/gridsize[0])+1
nDec=int(180/gridsize[1])+1
gridRA=np.arange(0,360+gridsize[0],gridsize[0])
gridDec=np.arange(90,-90-gridsize[1],-gridsize[1])

# set grid for imshow plot - centre of grid squares
nRAim=int(360/gridsize[0])
nDecim=int(180/gridsize[1])
gridRAim=np.arange(gridsize[0]/2,360,gridsize[0])
gridDecim=np.arange(90-gridsize[1]/2,-90,-gridsize[1])

# Loop over detector pairs and calculate dt across RA/Dec grid
maps={}
p=1
for d1 in detlist:
    for d2 in detlist:
        if d1>d2:
            maps[d1+d2]={'fignum':p}
            p=p+1
            # get vectors for d1 and d2
            d1vec=lb2vec(dets[d1]['loc'][0],dets[d1]['loc'][1])
            d2vec=lb2vec(dets[d2]['loc'][0],dets[d2]['loc'][1])
            # get distance between detectors (|d2-21|*R_earth)
            print('{}->{}:{}'.format(d1,d2,np.sqrt(np.dot(d2vec-d1vec,d2vec-d1vec))*const.R_earth.to('km')))
            
            if plottype=='contour':
                maps[d1+d2]['dtcont']=np.zeros([nDec,nRA])
                for r in range(nRA):
                    for d in range(nDec):
                        # get vector for sky localisation
                        vec=lb2vec(gridRA[r],gridDec[d])
                        # dt = vec . (d1-d1) * R_earth / c
                        dt=(np.dot(vec,d2vec-d1vec))*const.R_earth/const.c
                        maps[d1+d2]['dtcont'][d,r]=dt.value*1000
                        
            # grid form imshow
            maps[d1+d2]['dtim']=np.zeros([nDecim,nRAim])
            maps[d1+d2]['dtcsv']=np.zeros([nDecim,nRAim])
            for r in range(nRAim):
                for d in range(nDecim):
                    # get vector for sky localisation
                    vec=lb2vec(gridRAim[r],gridDecim[d])
                    # dt = vec . (d1-d1) * R_earth / c
                    dtim=(np.dot(vec,d2vec-d1vec))*const.R_earth/const.c
                    maps[d1+d2]['dtim'][d,r]=dtim.value*1000
                    maps[d1+d2]['dtcsv'][d,r]=np.around(dtim.value*1000,decimals=2)

# output data
for dd in maps: 
    df=pd.DataFrame(maps[dd]['dtcsv'])
    csvfile=os.path.join(dataDir,'tt_{}-{}.csv'.format(dets[dd[0]]['name'],dets[dd[1]]['name']))
    df.to_csv(csvfile,header=False,index=False)
    
# IF PLOTTING USING CONTOUR PLOTS
if plottype=='contour':
    labgridsize=[15,15]
    labgridRA=np.arange(0,360+labgridsize[0],labgridsize[0])
    labgridDec=np.arange(-90,90+labgridsize[1],labgridsize[1])
    for dd in maps:
        fig=plt.figure(maps[dd]['fignum'])
        plt.clf()
        
        # set colour levels
        if np.max(maps[dd]['dtcont'])<=15:
            dcol=2
        elif np.max(maps[dd]['dtcont'])<50:
            dcol=5
        cmin=np.floor(np.min(maps[dd]['dtcont'])/dcol)*dcol
        cmax=np.ceil(np.max(maps[dd]['dtcont'])/dcol)*dcol
        clev=2*cmax/dcol
        cmap=cm.get_cmap('jet',clev)
        cticks=np.linspace(cmin,cmax,int(clev+1))
        print(dd,np.min(maps[dd]['dtcont']),np.max(maps[dd]['dtcont']),cmin,cmax,cticks)
        
        plt.contourf(gridRA,gridDec,maps[dd]['dtcont'],cmap=cmap,vmin=cmin,vmax=cmax,levels=cticks)
        ax=plt.gca()
        ax.set_aspect('equal')
        plt.title('Time Difference: {}-{}'.format(dets[dd[0]]['name'],dets[dd[1]]['name']))
        
        # add ticks and labels
        ax.set_xticks(labgridRA,['']*len(labgridRA))
        ax.set_xticks(labgridRA[:-1]+labgridsize[0]/2,string.ascii_uppercase[:len(labgridRA)-1],minor=True)
        ax.set_yticks(labgridDec,['']*len(labgridDec))
        ax.set_yticks(labgridDec[:-1]+labgridsize[1]/2,range(len(labgridDec)-1),minor=True)
        ax.tick_params(axis='both',which='minor',length=0)

        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='milliseconds',ticks=cticks)
        pngFile=os.path.join(plotDir,'dt_contour_{}.png'.format(dd))
        plt.savefig(pngFile)
        
        # add letters for detectors
        # for det in dets:
        #     plt.annotate(det,(dets[det]['loc']),ha='center',va='center')

elif plottype=='imshow':
    dRAgrid=nRAim/24
    dDecgrid=nDecim/12
    for dd in maps:    
        fig=plt.figure(maps[dd]['fignum'])
        plt.clf()
        
        # set colour levels
        if np.max(maps[dd]['dtim'])<=15:
            dcol=2
        elif np.max(maps[dd]['dtim'])<50:
            dcol=5
        cmin=np.floor(np.min(maps[dd]['dtim'])/dcol)*dcol
        cmax=np.ceil(np.max(maps[dd]['dtim'])/dcol)*dcol
        clev=2*cmax/dcol
        cmap=cm.get_cmap('jet',clev)
        cticks=np.linspace(cmin,cmax,int(clev+1))
        print(dd,np.min(maps[dd]['dtim']),np.max(maps[dd]['dtim']),cmin,cmax,cticks)
        
        plt.imshow(maps[dd]['dtim'],aspect='equal',cmap=cmap,vmin=cmin,vmax=cmax)
        ax=plt.gca()
        ax.set_aspect('equal')
        # add ticks and labels
        plt.title('Time Difference: {}-{}'.format(dets[dd[0]]['name'],dets[dd[1]]['name']))
        ax.set_xticks(np.arange(0,nRAim,dRAgrid)-0.5,['']*24)
        ax.set_xticks(np.arange(np.max([0,(dRAgrid-1)/2]),nRAim,dRAgrid),string.ascii_uppercase[:24],minor=True)
        ax.set_yticks(np.arange(0,nDecim,dDecgrid)-0.5,['']*12)
        ax.set_yticks(np.arange(np.max([0,(dDecgrid-1)/2]),nDecim,dDecgrid),range(12),minor=True)
        ax.tick_params(axis='both',which='minor',length=0)
        
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='milliseconds',ticks=cticks)
        pngFile=os.path.join(plotDir,'dt_imshow_{}.png'.format(dd))
        plt.savefig(pngFile)
        
        
plt.show()