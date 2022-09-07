#!/usr/bin/perl

use YAML::XS 'LoadFile';
use JSON::XS;
use open qw( :std :encoding(UTF-8) );
use Data::Dumper;


my %colours = (
	'black'=>"\033[0;30m",
	'red'=>"\033[0;31m",
	'green'=>"\033[0;32m",
	'yellow'=>"\033[0;33m",
	'blue'=>"\033[0;34m",
	'magenta'=>"\033[0;35m",
	'cyan'=>"\033[0;36m",
	'white'=>"\033[0;37m",
	'none'=>"\033[0m"
);


# Load the main config file
my $config = LoadFile('config.yml');

# Load the languages and translations
$config = loadLanguages($config);

# Copy the site to the destination directory
siteCopy($config);






##############################
# Load Languages
sub loadLanguages {
	my $config = shift;
	my $tran;

	$config->{'language'}{'languages'} = LoadFile($config->{'language'}{'file'});

	foreach $a (keys(%{$config->{'translations'}})){
		$file = $config->{'translations'}{$a};
		if(-e $file){
			print "Loading translation $colours{'cyan'}$a$colours{'none'} from $colours{'green'}$file$colours{'none'}\n";
			$tran = LoadFile($file);
			$config->{'translations'}{$a} = $tran->{'text'};
		}else{
			print "ERROR: Translation file $colours{'green'}$file$colours{'none'} doesn't exist\n";
		}
	}

	return $config;
}

sub siteCopy {
	my $config = shift;
	my $dir;

	# Remove current contents of the build directory
	if(-d $config->{'build'}){
		print "Removing existing build...\n";
		`rm $config->{'build'}* -R`;
	}

	# Create the default language first
	if($config->{'language'}{'default'}){
		siteCopyLanguage($config->{'language'}{'default'},$config->{'build'},$config);
	}

	# Create each translation
	foreach $lang (sort(keys(%{$config->{'language'}{'languages'}}))){

		# Create a copy in the language sub-directory
#		siteCopyLanguage($lang,$config->{'build'}.$lang."/",$config);
	}
	return;
}

sub siteCopyLanguage {
	my $lang = shift;
	my $dir = shift;
	my $config = shift;

	print "Create $colours{'cyan'}$config->{'language'}{'languages'}{$lang}{'label'}$colours{'none'} version in $dir\n";

	if(!-d $dir){
		`mkdir $dir`;
	}

	siteCopyDirectory($lang,"",$dir,$config);

	return;
}

sub siteCopyDirectory {
	my $lang = shift;
	my $sdir = shift;
	my $ddir = shift;
	my $config = shift;
	
	my ($dir,$path,$dh,$filename);
	$dir = $config->{'src'}.$sdir;

	opendir($dh,$dir);
	while( ($filename = readdir($dh))) {
		
		if($filename ne "." && $filename ne ".."){

			$path = $ddir.$sdir.$filename;

			if(-d $dir.$filename){

				if(!-d $path){
					`mkdir $path`;
				}

				siteCopyDirectory($lang,$sdir.$filename."/",$ddir,$config);

			}else{

				fileCopyLanguage($lang,$dir.$filename,$path,$config);

			}
		}
	}
	closedir($dh);

}

sub fileCopyLanguage {
	my $lang = shift;
	my $inp = shift;
	my $out = shift;
	my $config = shift;

	my ($fh,@lines,$str,$nstr,$key,@parts,$p,$o,@bits);
	print "\t$colours{'green'}$inp$colours{'none'} -> $colours{'green'}$out$colours{'none'}\n";
	my $coder = JSON::XS->new->utf8->allow_nonref;


	if($inp =~ /\.html$/ || $inp =~ /\.js$/){
		# Process
		#print "\tProcess $inp\n";
		open($fh,$inp);
		@lines = <$fh>;
		close($fh);
		$str = join("",@lines);
		$nstr = $str;
		while($str =~ /\{\{ ?([^\}]*) ? \}\}/){
			$key = $1;
			$value = "{{ $key }}";
			if($key =~ /^site\.translations/){

				@parts = split(/\./,$key);
				$f = $config->{'translations'};
				for($p = 2; $p < @parts; $p++){
					if($f->{$parts[$p]}){
						$f = $f->{$parts[$p]};
					}else{
						print "No translation for $key ($p $parts[$p])\n";
						$f = "";
						$p = @parts;
					}
				}

				if($f){
					if($f->{$lang}){
						$value = $f->{$lang};
					}else{
						if($f->{$config->{'language'}{'default'}}){
							$value = $f->{$config->{'language'}{'default'}};
						}else{
							if($f){
								print "\tReturn JSON structure for $colours{'red'}$key$colours{'none'}\n";
								# Loop over f only keeping the required language
								foreach $p (keys(%{$f})){
									if($f->{$p}{$lang}){
										$f->{$p} = $f->{$p}{$lang};
									}
								}
								$value = $coder->encode($f);
							}else{
								print "Translation and default translation don't exist for $key\n";
							}
						}
					}
				}
			}elsif($key =~ /^site\.lang/){
				$value = $lang;
			}else{
				print "Don't know how to deal with $key\n";
			}
			$str =~ s/\{\{ ?$key ?\}\}//g;
			$nstr =~ s/\{\{ ?$key ?\}\}/$value/g;
		}

		open($fh,">",$out);
		print $fh $nstr;
		close($fh);
	}else{
		if($out){
			`cp $inp $out`;
		}else{
			print "No destination for $inp\n";
		}
	}
	return;
}