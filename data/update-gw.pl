#!/usr/bin/perl

use Cwd qw(abs_path);
use Data::Dumper;
use JSON::XS;
use POSIX qw(strftime);


# Get the real base directory for this script
my $basedir = "./";
if(abs_path($0) =~ /^(.*\/)[^\/]*/){ $basedir = $1; }

require $basedir.'lib.pl';

$basedir .= "../";

$idir = $basedir."data/";
$odir = $basedir."src/gw/BF09C01672351154C152349A7F011C6DBB40A4A0/";
$wwdir = $basedir."data/GW/waveforms/";
$wsdir = $basedir."data/GW/templates/";
$wodir = $basedir."src/gw/waveform-fitter/waveforms/";
$dp = 3;
@massratios = ("0.1","0.2","0.3","0.4","0.5","0.6","0.7","0.8","0.9","1.0");


# Open the scenario file for GW
$file = $idir."scenario-1.json";
$json = LoadJSON($file);

# Add generation note
$json->{'_notes'} = "Created by $0 using data/scenario-1.json";
$json->{'_update'} = strftime("%FT%TZ",gmtime);

# Trim decimal places in grid map values
foreach $ev (sort(keys(%{$json->{'events'}}))){
	foreach $det (sort(keys(%{$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}}))){
		for($i = 0; $i < @{$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}}; $i++){
			for($j = 0; $j < @{$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}[$i]}; $j++){
				$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}[$i][$j] = sprintf("%0.".$dp."f",$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}[$i][$j])+0;
			}
		}
	}
	foreach $f (sort(keys(%{$json->{'events'}{$ev}{'GW'}{'files'}}))){
		if($f =~ /\_csv/){
			if($f =~ /waveform/){
				$w = $wwdir;
			}else{
				$w = $wsdir;
			}
			if(-e $w.$json->{'events'}{$ev}{'GW'}{'files'}{$f}){
				# If the file has a "q1.0" type string in it we will check for the different mass ratios
				if($json->{'events'}{$ev}{'GW'}{'files'}{$f} =~ /q1\.0/){
					for($q = 0; $q < @massratios; $q++){
						$qfile = $json->{'events'}{$ev}{'GW'}{'files'}{$f};
						$qfile =~ s/q1\.0/q$massratios[$q]/;
						msg("Copying <cyan>$w$qfile<none> to <cyan>$wodir<none>\n");
						`cp $w$qfile $wodir$qfile`;
					}
				}else{
					msg("Copying <cyan>$w$json->{'events'}{$ev}{'GW'}{'files'}{$f}<none> to <cyan>$wodir<none>\n");
					`cp $w$json->{'events'}{$ev}{'GW'}{'files'}{$f} $wodir$json->{'events'}{$ev}{'GW'}{'files'}{$f}`;
				}
				$json->{'events'}{$ev}{'GW'}{'files'}{$f} =~ s/q1\.0/q{MASSRATIO}/;
			}else{
				warning("Can't copy <cyan>$w$json->{'events'}{$ev}{'GW'}{'files'}{$f}<none>\n");
			}
		}
	}
	
}

SaveJSON($json,$odir."scenario.json",4);

$opts = "";
foreach $ev (sort(keys(%{$json->{'events'}}))){
	if(!$json->{'events'}{$ev}{'name'}){
		warning("Missing name for $ev\n");
	}
	if(!$json->{'events'}{$ev}{'datetime'}){
		warning("Missing datetime for $ev\n");
	}
	if(!$json->{'events'}{$ev}{'GW'}){
		warning("Missing GW for $ev\n");
	}
	if(!$json->{'events'}{$ev}{'GW'}{'files'}){
		warning("Missing GW->files for $ev\n");
	}
	if(!$json->{'events'}{$ev}{'GW'}{'files'}{'waveform_csv'}){
		warning("Missing GW->files->waveform_csv for $ev\n");
	}
	if(!$json->{'events'}{$ev}{'GW'}{'files'}{'simulations_csv'}){
		warning("Missing GW->files->simulations_csv for $ev\n");
	}
	$opts .= "<option value=\"$ev\">$json->{'events'}{$ev}{'name'}</option>\n";
}
#partOfHTML($odir."index.html",{"EVENT"=>$opts});
#partOfHTML($odir."1/index.html",{"EVENT"=>$opts});




##############
# SUBROUTINES
sub partOfHTML {
	my $file = shift;
	my $repl = $_[0];

	local(@lines,$indent,$str,$code,$frag,$rep);

	open(FILE,$file);
	@lines = <FILE>;
	close(FILE);
	$str = join("",@lines);

	foreach $code (keys(%{$repl})){

		$indent = "";	
		$str =~ s/[\n\r]/\=\=\=NEWLINE\=\=\=/g;
		if($str =~ /(<!-- $code START -->)(.*)(<!-- $code END -->)/){

			$frag = $2."";
			$indent = "";
			$frag =~ s/\=\=\=NEWLINE\=\=\=/\n/g;
			if($frag =~ /^(\n\t+)/){
				$indent = $1;
			}
			$rep = $repl->{$code};
			$rep =~ s/\n/$indent/g;
			$rep = $indent.$rep;
			$str =~ s/(<!-- $code START -->).*(<!-- $code END -->)/$1$rep$2/g;
		}
		$str =~ s/\=\=\=NEWLINE\=\=\=/\n/g;
	}
	open(FILE,">",$file);
	print FILE $str;
	close(FILE);
#	<!-- EVENT START -->
#	<option value="LVKyymmdd_hhmmss A" data-date="dd-mmm-yy hh:mm:ss GMT" data-waveform="data/dataHanford.csv">LVKyymmdd_hhmmss A</option>
#	<option value="LVKyymmdd_hhmmss B" data-date="dd-mmm-yy hh:mm:ss GMT" data-waveform="waveforms/GW170817_waveform.csv">LVKyymmdd_hhmmss B</option>
#	<option value="LVKyymmdd_hhmmss C" data-date="dd-mmm-yy hh:mm:ss GMT" data-waveform="waveforms/GW170817_waveform.csv">LVKyymmdd_hhmmss C</option>
#	<!-- EVENT END -->
	
}

#sub saveJSON {
#	my $file = shift;
#	my $json = $_[0];
#
#	$str = JSON::XS->new->utf8->canonical->pretty->encode($json);
#
#	# Clean up
#
#	# Swap spaces for tabs
#	$str =~ s/   /\t/g;	
#
#	# Compress number arrays
#	$str =~ s/\n\t{7}([0-9\.\-]+)/$1/g;
#	$str =~ s/\[\n\t{6}\[/\[\[/g;
#	$str =~ s/\n\t{6}\],\n\t{6}\[/\],\[/g;
#	$str =~ s/\n\t{6}\]\n\t{5}\]/\]\]/g;
#
#	# Save the file
#	open(JSON,">",$file);
#	print JSON $str;
#	close(JSON);
#
#	return;
#}