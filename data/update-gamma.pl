#!/usr/bin/perl

use Cwd qw(abs_path);
use Data::Dumper;
use JSON::XS;
use POSIX qw(strftime);


# Get the real base directory for this script
my $basedir = "./";
if(abs_path($0) =~ /^(.*\/)[^\/]*/){ $basedir = $1; }

require $basedir.'lib.pl';

$gdir = $basedir."gamma/";
$basedir .= "../";

#$wodir = $basedir."src/gw/waveform-fitter/waveforms/";


# Open the GW scenario file
$file = $basedir."data/scenario-1.json";
$json = LoadJSON($file);


# Open the gamma-ray scenario file
$file = $basedir."data/gamma/scenarios.json";
$gamma = LoadJSON($file);

foreach $ev ((keys(%{$gamma->{'events'}}))){

	msg("Processing <green>$ev<none>\n");

	# Process peaks
	if($gamma->{'events'}{$ev}{'peaks'}){
		$peakconf = $gamma->{'events'}{$ev}{'peaks'};
		delete $gamma->{'events'}{$ev}{'peaks'};
		if(-e $gdir.$peakconf->{'file'}){
			@peaks = LoadCSV($gdir.$peakconf->{'file'});
			$gamma->{'events'}{$ev}{'peaks'} = {};
			for($p = 0; $p < @peaks; $p++){
				$gamma->{'events'}{$ev}{'peaks'}{$peaks[$p]{$peakconf->{'detector'}}} = $peaks[$p]{$peakconf->{'count'}}+0;
			}
		}
	}

	# Process lightcurve
	$lightconf = $gamma->{'events'}{$ev}{'lightcurve'};
	delete $gamma->{'events'}{$ev}{'lightcurve'};
	if(-e $gdir.$lightconf->{'file'}){
		@vals = LoadCSV($gdir.$lightconf->{'file'});
		$gamma->{'events'}{$ev}{'lightcurve'} = ();
		if(ref($lightconf->{'count'}) eq "ARRAY"){
			@cols = @{$lightconf->{'count'}};
		}else{
			@cols = ($lightconf->{'count'});
		}

		$calcpeaks = 0;
		
		if(!$gamma->{'events'}{$ev}{'peaks'}){
			$calcpeaks = 1;
			$gamma->{'events'}{$ev}{'peaks'} = {};
			for($c = 0; $c < @cols; $c++){
				$gamma->{'events'}{$ev}{'peaks'}{$cols[$c]} = 0;
			}
		}

		for($i = 0; $i < @vals; $i++){
	
			$gamma->{'events'}{$ev}{'lightcurve'}[$i][0] = $vals[$i]{$lightconf->{'time'}}+0;
			$v = 0;
			for($c = 0; $c < @cols; $c++){
				$vals[$i]{$cols[$c]} += 0;
				$v += $vals[$i]{$cols[$c]};
				if($calcpeaks && $vals[$i]{$cols[$c]} > $gamma->{'events'}{$ev}{'peaks'}{$cols[$c]}){
					$gamma->{'events'}{$ev}{'peaks'}{$cols[$c]} = $vals[$i]{$cols[$c]};
				}
			}
			$gamma->{'events'}{$ev}{'lightcurve'}[$i][1] = $v;
		}
	}
	
	# Process detectors
	$conf = $gamma->{'events'}{$ev}{'detector'};
	delete $gamma->{'events'}{$ev}{'detector'};
	if(-e $gdir.$conf->{'file'}){
		@vals = LoadCSV($gdir.$conf->{'file'});
		$gamma->{'events'}{$ev}{'detector'} = {'locations'=>{}};
		for($i = 0; $i < @vals; $i++){
			$gamma->{'events'}{$ev}{'detector'}{'locations'}{$vals[$i]{$conf->{'detector'}}} = {
				'RA' => {'value'=> $vals[$i]{$conf->{'ra'}{'value'}}+0,'uncertainty'=> ($vals[$i]{$conf->{'ra'}{'uncertainty'}}||10)+0},
				'Dec' => {'value'=> $vals[$i]{$conf->{'dec'}{'value'}}+0,'uncertainty'=> ($vals[$i]{$conf->{'dec'}{'uncertainty'}}||10)+0}
			}
			
		}
	}

	
}


$gamma->{'_notes'} = "Created by data/update-gamma.pl from data/gamma/scenarios.json";
$gamma->{'_update'} = strftime("%FT%TZ",gmtime);

SaveJSON($gamma,"src/gamma/A7E558CE2429F1718F26EBE3B9B961C617018962/scenario.json",3);

